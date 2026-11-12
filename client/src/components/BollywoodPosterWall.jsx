import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { posters } from './PosterWall';

export default function BollywoodPosterWall({ onBack }) {
  const [selectedPoster, setSelectedPoster] = useState(null);

  return <main className="bollywood-poster-page">
    <header className="bollywood-poster-nav">
      <button className="poster-page-back" onClick={onBack}><ArrowLeft size={17}/> Back to the café</button>
    </header>
    <div className="bollywood-poster-content">
      <section className="bollywood-poster-mural" aria-label="Bollywood poster collage">
        <div className="bollywood-poster-grid">
          {posters.map(([src, alt], index) => <button key={src} className={`mural-poster mural-poster-${index % 8}`} onClick={() => setSelectedPoster({ src, alt })} aria-label={`View ${alt}`} title={alt}>
            <span className="poster-print-pin" aria-hidden="true" />
            <span className="poster-print-photo"><img src={`/images/posters/${src}`} alt={alt} /></span>
            <span className="poster-print-caption">{alt}</span>
          </button>)}
        </div>
      </section>
    </div>
    {selectedPoster && <div className="mural-poster-lightbox" role="presentation" onClick={() => setSelectedPoster(null)}>
      <section role="dialog" aria-modal="true" aria-label={selectedPoster.alt} onClick={event => event.stopPropagation()}>
        <button onClick={() => setSelectedPoster(null)} aria-label="Close poster"><X size={22}/></button>
        <img src={`/images/posters/${selectedPoster.src}`} alt={selectedPoster.alt}/>
        <p>{selectedPoster.alt}</p>
      </section>
    </div>}
  </main>;
}
