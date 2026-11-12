import React, { useState } from 'react';
import PosterWall from './PosterWall';

export default function StreetScene({ onEnter, onNavigate, on360 }) {
  const [opening, setOpening] = useState(false);
  const enter = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(onEnter, 650);
  };
  return <main className={`street-scene pixel-street${opening ? ' is-entering' : ''}`}>
    <button className="scene-360-trigger street-360-trigger" onClick={on360} aria-label="Open a 360 degree view of the café exterior">360° View</button>
    <div className="street-title" aria-label="देसी Chipsy Cafe">
      <h2><span className="hindi-desi">देसी</span><span className="street-title-latin">Chipsy Cafe</span></h2>
    </div>
    <PosterWall place="outside" onOpenGallery={() => onNavigate?.('posters')} />
    <button className="street-cafe-hotspot" onClick={enter} aria-label="Open the door and enter देसी Chipsy Cafe" title="Come inside" />
    <div className="street-footnote"><span>Click the café to come inside</span></div>
  </main>;
}
