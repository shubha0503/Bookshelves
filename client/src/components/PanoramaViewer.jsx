import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Move, Minus, Plus } from 'lucide-react';

const VERTEX_SHADER = `
attribute vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D u_panorama;
uniform vec2 u_resolution;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_fov;
const float PI = 3.141592653589793;
void main(){
  vec2 screen = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  screen.x *= u_resolution.x / u_resolution.y;
  float scale = tan(u_fov * 0.5);
  vec3 forward = vec3(sin(u_yaw) * cos(u_pitch), sin(u_pitch), -cos(u_yaw) * cos(u_pitch));
  vec3 right = vec3(cos(u_yaw), 0.0, sin(u_yaw));
  vec3 up = cross(right, forward);
  vec3 direction = normalize(forward + right * screen.x * scale + up * screen.y * scale);
  float longitude = atan(direction.x, -direction.z);
  float latitude = asin(clamp(direction.y, -1.0, 1.0));
  vec2 uv = vec2(fract(longitude / (2.0 * PI) + 0.5), 0.5 - latitude / PI);
  gl_FragColor = texture2D(u_panorama, uv);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error || 'Could not compile panorama shader');
  }
  return shader;
}

export default function PanoramaViewer({ scene, onClose, onChangeScene }) {
  const canvasRef = useRef(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const fovRef = useRef(Math.PI / 2.2);
  const dragRef = useRef(null);
  const renderRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const isInterior = scene === 'cafe';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let gl;
    let animationFrame;
    let texture;
    let program;
    let observer;

    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL is unavailable');
      const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Could not link panorama shader');
      gl.useProgram(program);

      const positions = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positions);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(program, 'u_panorama'), 0);

      const image = new Image();
      image.onload = () => {
        if (!gl || gl.isContextLost()) return;
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 2048;
        textureCanvas.height = 1024;
        const context = textureCanvas.getContext('2d');
        context.imageSmoothingEnabled = true;
        context.drawImage(image, 0, 0, textureCanvas.width, textureCanvas.height);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);
        setReady(true);
      };
      image.onerror = () => setFailed(true);
      image.src = `/images/cafe-360-${isInterior ? 'interior' : 'exterior'}.png`;

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
        const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      const render = () => {
        resize();
        gl.useProgram(program);
        gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
        gl.uniform1f(gl.getUniformLocation(program, 'u_yaw'), yawRef.current);
        gl.uniform1f(gl.getUniformLocation(program, 'u_pitch'), pitchRef.current);
        gl.uniform1f(gl.getUniformLocation(program, 'u_fov'), fovRef.current);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrame = requestAnimationFrame(render);
      };
      renderRef.current = render;
      render();
    } catch {
      setFailed(true);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      if (gl && !gl.isContextLost()) {
        if (texture) gl.deleteTexture(texture);
        if (program) gl.deleteProgram(program);
      }
      renderRef.current = null;
      setReady(false);
    };
  }, [isInterior]);

  const handlePointerDown = event => {
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add('is-dragging');
  };

  const handlePointerMove = event => {
    if (!dragRef.current || dragRef.current.id !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    yawRef.current -= dx * 0.0045;
    pitchRef.current = Math.max(-0.62, Math.min(0.62, pitchRef.current + dy * 0.0035));
  };

  const handlePointerUp = event => {
    dragRef.current = null;
    event.currentTarget.classList.remove('is-dragging');
  };

  const zoom = direction => {
    fovRef.current = Math.max(0.72, Math.min(1.78, fovRef.current + direction * 0.12));
  };

  useEffect(() => {
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return <main className="panorama-viewer" aria-label={`${isInterior ? 'Café interior' : 'Café exterior'} 360 degree view`}>
    <canvas
      ref={canvasRef}
      className={`panorama-canvas${ready ? ' is-ready' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Drag to look around the 360 degree café view"
    />
    {!ready && !failed && <div className="panorama-loading">Loading the café view…</div>}
    {failed && <div className="panorama-loading panorama-error">The 360 view could not load in this browser.</div>}
    <header className="panorama-toolbar">
      <button type="button" onClick={onClose}><ArrowLeft size={17}/> Back to scene</button>
      <div><strong>देसी Chipsy Cafe</strong><span>{isInterior ? 'Inside · 360°' : 'Street · 360°'}</span></div>
      <span className="panorama-drag-hint"><Move size={15}/> Drag to look around</span>
    </header>
    <nav className="panorama-controls" aria-label="360 view controls">
      <button type="button" onClick={() => zoom(-1)} aria-label="Zoom out"><Minus size={16}/></button>
      <button type="button" onClick={() => zoom(1)} aria-label="Zoom in"><Plus size={16}/></button>
      <button type="button" className="panorama-switch" onClick={() => onChangeScene(isInterior ? 'street' : 'cafe')}>
        {isInterior ? 'Step outside' : 'Enter café'}
      </button>
    </nav>
  </main>;
}
