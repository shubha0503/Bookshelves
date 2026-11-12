import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PosterWall from './PosterWall';

export default function CafeInterior({ onNavigate, onBack, radio, on360 }) {

  return <main className="interior-scene pixel-interior">
    <header className="cafe-topline"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Back to the street</button><span><span className="hindi-desi">देसी</span> CHIPSY CAFE <i>·</i> INSIDE</span><button className="scene-360-trigger" onClick={on360} aria-label="Open a 360 degree view of the café interior">360° View</button></header>
    <div className="interior-room pixel-room" aria-label="Full-screen Indian book café interior">
      <PosterWall place="inside" onOpenGallery={() => onNavigate('posters')} />
      <div className={`filmi-radio-badge${radio?.musicPlaying ? ' is-playing' : ''}`} aria-label="Café radio">
        <button className="radio-main-control" onClick={radio?.togglePlayback} aria-label={radio?.musicPlaying ? 'Pause music' : radio?.selectedSong ? 'Resume music' : 'Play a random song'} title={radio?.musicPlaying ? 'Pause music' : radio?.selectedSong ? 'Resume music' : 'Play a random song'}>
          <span className="radio-badge-icon">{radio?.musicPlaying ? 'Ⅱ' : '♫'}</span>
          <span className="radio-badge-copy"><b>देसी रेडियो</b><small>{radio?.selectedSong ? radio.selectedSong.title : radio?.playerReady ? 'ट्यून इन · tap to play' : 'रेडियो जोड़ रहा है…'}</small></span>
          <span className="radio-badge-light" />
        </button>
        <button className="radio-next-control" onClick={radio?.tuneRandomSong} aria-label="Play another random song" title="Next song">↻</button>
        <button className="radio-stop-control" onClick={radio?.stopPlayback} aria-label="Stop music" title="Stop music">■</button>
      </div>
       <button className="pixel-hotspot table-menu-button" onClick={()=>onNavigate('menu')} aria-label="Open the café menu from the center table"><span>MENU</span></button>
      <button className="pixel-scene-hotspot hotspot-shelves" onClick={()=>onNavigate('bookshelf')} aria-label="Explore the bookshelves"><span>BOOKSHELVES</span></button>
      <button className="pixel-scene-hotspot hotspot-reading" onClick={()=>onNavigate('reading')} aria-label="Visit the reading corner"><span>READING CORNER</span></button>
    </div>
  </main>;
}
