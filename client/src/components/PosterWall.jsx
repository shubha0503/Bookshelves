import React, { useState } from 'react';

export const posters = [
  ['poster-bitch-aurat.jpg', 'Aurat poster'],
  ['poster-koi-hai.jpg', 'Koi hai quote poster'],
  ['poster-badi-manzil.jpg', 'Badi manzil quote'],
  ['poster-kahin-pochne.jpg', 'Kahin pahunchne quote from Yeh Jawaani Hai Deewani'],
  ['poster-mohabbat.jpg', 'Mohabbat kar toh le poster'],
  ['poster-sanson.jpg', 'Sanson Ki Mala poster'],
  ['poster-bollywood-wall.jpg', 'Vintage Bollywood poster collage'],
  ['poster-desi-coke.jpg', 'Desi Coke poster'],
  ['poster-baddie-era.jpg', 'Bollywood baddie era collage'],
  ['poster-barfi.jpg', 'Barfi film poster'],
  ['poster-om-shanti-om.jpg', 'Om Shanti Om poster'],
  ['poster-anand.jpg', 'Anand film poster'],
  ['poster-chalti-ka-naam-gaadi.jpg', 'Chalti Ka Naam Gaadi poster'],
  ['poster-nimboo-mirchi.jpg', 'Nimboo mirchi poster'],
  ['poster-jab-we-met.jpg', 'Jab We Met poster'],
  ['poster-ok-jaanu.jpg', 'OK Jaanu poster'],
  ['poster-yjhd-bunny.jpg', 'Yeh Jawaani Hai Deewani · Bunny and Naina'],
  ['poster-2-states.jpg', '2 States collage'],
  ['poster-3-idiots.jpg', '3 Idiots · All is well'],
  ['poster-are-oh-sambha.jpg', 'Are oh Sambha · Sholay'],
  ['poster-zindagi-badi.jpg', 'Zindagi badi honi chahiye'],
  ['poster-tamasha-ending.jpg', 'Tamasha · apni kahaani'],
  ['poster-senorita.jpg', 'Senorita · bade bade desho mein'],
  ['poster-kaminey.jpg', 'Kaminey · jhand fakir suar ki'],
  ['poster-radio-honey.jpg', 'Radio honey · desi radio'],
  ['poster-ustad.jpg', 'Ustaad · ab hum haath se nikal chuke hain'],
  ['poster-rockstar.jpg', 'Rockstar · 2011'],
  ['poster-chhichhore.jpg', 'Chhichhore · keep going with your silly dream'],
  ['poster-behti-hawa.jpg', 'Behti Hawa Sa Tha Woh'],
  ['poster-wake-up-sid.jpg', 'Wake Up Sid collage'],
  ['poster-woman-to-woman.jpg', 'Woman to woman · tum Menka ho'],
  ['poster-guu-khalo.jpg', 'Wo na aap guu khalo'],
  ['poster-gumshudah-lyric.jpg', 'Gumshudah · mere dil rahat mein bas tera naam'],
  ['poster-bwoy.jpg', 'Bwoy? · Zindagi Na Milegi Dobara'],
  ['poster-chennai-express-collage.jpg', 'Chennai Express collage'],
  ['poster-michael-scott-believes.jpg', 'Michael Scott · believe in you'],
  ['poster-babumoshai-classic.jpg', 'Babumoshai · zindagi badi honi chahiye'],
  ['poster-love-aaj-kal-collage.jpg', 'Love Aaj Kal collage'],
  ['poster-michael-scott.jpg', 'Michael Scott · everything will be okay'],
  ['poster-daaru-to-yuhi.jpg', 'Daaru to yuhi badnaam hai'],
  ['poster-om-shanti-om-quote.jpg', 'Om Shanti Om · agar kisi cheez ko dil se chaho'],
  ['poster-om-shanti-om-collage.jpg', 'Om Shanti Om collage'],
  ['poster-some-goodbyes.jpg', 'Some goodbyes don’t end the love'],
  ['poster-swag.jpg', 'Swag · ready hokar hot lagna'],
  ['poster-thats-what-she-said.jpg', 'That’s what she said · Michael Scott'],
  ['poster-yjhd-motivation.jpg', 'Yeh Jawaani Hai Deewani · kahin pahunchne ke liye'],
  ['poster-tamasha-story.jpg', 'Tamasha · tumhari apni kahaani'],
  ['poster-lucknow-da-kurta.jpg', 'Lucknow da kurta · Pathani salwar']
];

export default function PosterWall({ place = 'inside', onOpenGallery }) {
  const [open, setOpen] = useState(false);
  const exterior = place === 'outside';
  if (!exterior) return <div className="poster-wall poster-wall-inside" aria-label="Framed Bollywood poster on the café wall">
    <button className="poster-frame-single" onClick={() => onOpenGallery ? onOpenGallery() : setOpen(true)} aria-label="Open the Bollywood poster wall" title="Open the Bollywood poster wall">
      <img src={`/images/posters/${posters[6][0]}`} alt={posters[6][1]} />
    </button>
  </div>;
  const visible = [posters[6], posters[11], posters[1]];
  return <>
    <div className={`poster-wall poster-wall-${place}`} aria-label={`${exterior ? 'Outside' : 'Inside'} Bollywood poster wall`}>
      {visible.map(([src, alt]) => <button key={src} className="poster-frame" onClick={() => onOpenGallery ? onOpenGallery() : setOpen(true)} aria-label={`Open poster wall: ${alt}`}>
        <img src={`/images/posters/${src}`} alt={alt} />
      </button>)}
      <button className="poster-wall-sign" onClick={() => onOpenGallery ? onOpenGallery() : setOpen(true)}><span className="poster-wall-sign-hindi">चंचल मन अति रैंडम</span></button>
    </div>
    {open && <div className="poster-gallery-overlay" role="presentation" onClick={() => setOpen(false)}>
      <section className="poster-gallery" role="dialog" aria-modal="true" aria-label="Desi Bollywood poster wall" onClick={event => event.stopPropagation()}>
        <button className="poster-gallery-close" onClick={() => setOpen(false)} aria-label="Close poster wall">×</button>
        <p className="tiny-label">देसी CHIPSY CAFE · FILMI YAADें</p>
        <h2>Our Bollywood poster wall</h2>
        <div className="poster-gallery-grid">{posters.map(([src, alt]) => <figure key={src}>
          <img src={`/images/posters/${src}`} alt={alt} />
          <figcaption>{alt}</figcaption>
        </figure>)}</div>
      </section>
    </div>}
  </>;
}
