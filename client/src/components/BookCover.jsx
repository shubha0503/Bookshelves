import React, { useEffect, useState } from 'react';

const COVER_PALETTES = [
  { bg: '#294538', accent: '#C5A059', textColor: '#F7F3EB' }, // Forest Green
  { bg: '#684A37', accent: '#EAE0D1', textColor: '#F7F3EB' }, // Walnut
  { bg: '#1B263B', accent: '#C5A059', textColor: '#E0E1DD' }, // Midnight Navy
  { bg: '#582C4D', accent: '#F7F3EB', textColor: '#F7F3EB' }, // Vintage Plum
  { bg: '#78281F', accent: '#C5A059', textColor: '#FADBD8' }, // Oxblood
  { bg: '#34495E', accent: '#C5A059', textColor: '#EBEDEF' }, // Slate
];

export default function BookCover({ title, author, coverUrl, width = '100%', height = '100%', style = {} }) {
  const coverCandidates = (Array.isArray(coverUrl) ? coverUrl : coverUrl ? [coverUrl] : []).filter(Boolean);
  const candidateKey = coverCandidates.join('|');
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => setCandidateIndex(0), [title, candidateKey]);

  // Deterministic palette based on title
  const paletteIndex = Math.abs(
    (title || 'book').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % COVER_PALETTES.length;

  const palette = COVER_PALETTES[paletteIndex];

  if (!coverCandidates[candidateIndex]) {
    return (
      <div 
        className="book-cover-container" 
        style={{ width, height, ...style }}
        aria-label={`${title} by ${author}`}
      >
        <div 
          className="book-cover-fallback" 
          style={{ backgroundColor: palette.bg, color: palette.textColor }}
        >
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8, textAlign: 'center' }}>
            Margins Library
          </div>
          <h4 className="fallback-title" style={{ color: palette.textColor }}>
            {title}
          </h4>
          <p className="fallback-author" style={{ color: palette.accent }}>
            {author}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="book-cover-container" style={{ width, height, ...style }}>
      <img
        src={coverCandidates[candidateIndex]}
        alt={`Cover of ${title} by ${author}`}
        className="book-cover-img"
        onError={() => setCandidateIndex(index => index + 1)}
        loading="lazy"
      />
    </div>
  );
}
