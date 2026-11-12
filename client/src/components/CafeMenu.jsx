import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import '../menu-book.css';

const menuPages = [
  { image: 'menu-design-reference.jpg', alt: 'Full-page illustrated menu design', title: 'देसी मेन्यू', subtitle: 'A little something for every kind of craving', cover: true },
  { image: 'pani-puri.jpg', alt: 'Pani puri poster', title: 'Pani puri', subtitle: 'A little burst of tangy, crunchy joy.' },
  { image: 'samosa.jpg', alt: 'Samosa poster', title: 'Samosa', subtitle: 'Flaky, golden, and properly masaledaar.' },
  { image: 'kachori.jpg', alt: 'Kachori poster', title: 'Kachori', subtitle: 'A crisp, spicy bite with a little extra crunch.' },
  { image: 'chole-bhature.jpg', alt: 'Chole bhature poster', title: 'Chole bhature', subtitle: 'Soft bhature, hearty chole, happy appetite.' },
  { image: 'chur-chur-naan.jpg', alt: 'Chur chur naan platter poster', title: 'Chur-chur naan platter', subtitle: 'Buttery naan with a cosy bowl of chole.' },
  { image: 'momos.jpg', alt: 'Momos poster', title: 'Momos', subtitle: 'Steamy little dumplings with fiery chutney.' },
  { image: 'chowmein.jpg', alt: 'Chowmein poster', title: 'Chowmein', subtitle: 'A full plate of saucy, street-style noodles.' },
  { image: 'hyderabadi-biryani.jpg', alt: 'Hyderabadi biryani poster', title: 'Hyderabadi biryani', subtitle: 'Fragrant rice, warm spices, and a proper feast.' },
  { image: 'parle-g-chai.jpg', alt: 'Chai and Parle-G poster', title: 'Chai & Parle-G', subtitle: 'The original chapter-break combo.' },
  { image: 'chai-poster.jpg', alt: 'Garam chai poster', title: 'Garam chai', subtitle: 'Strong, sweet, and best served in good company.' },
  { image: 'jalebi.jpg', alt: 'Fresh jalebi poster', title: 'Fresh jalebi', subtitle: 'Warm, syrupy spirals with a little crunch.' },
  { image: 'thandai.jpg', alt: 'Thandai poster', title: 'Thandai', subtitle: 'A chilled, creamy sip with festive flavours.' },
  { image: 'desi-juice.jpg', alt: 'Desi juice poster', title: 'Desi juice', subtitle: 'A bright, refreshing street-side favourite.' },
  { image: 'biscoff-order.jpg', alt: 'Biscoff sundae poster', title: 'Biscoff sundae', subtitle: 'A sweet café treat for the plot.' }
];

export default function CafeMenu({ onBack }) {
  const [page, setPage] = useState(0);
  const current = menuPages[page];

  const turnPage = direction => setPage(value => Math.max(0, Math.min(menuPages.length - 1, value + direction)));
  return <main className="menu-book-screen">
    <img className="menu-book-full-photo" key={current.image} src={`/images/menu/${current.image}`} alt={current.alt} />
    <div className="menu-book-photo-shade" aria-hidden="true" />
    <header className="menu-book-nav">
      <button className="menu-book-back" onClick={onBack}><ArrowLeft size={16}/> Back into the café</button>
      <span><span className="hindi-desi">देसी</span> CHIPSY CAFE · MENU</span>
    </header>
    <nav className="menu-book-controls" aria-label="Turn menu pages">
      <button aria-label="Previous menu page" onClick={() => turnPage(-1)} disabled={page === 0}><ArrowLeft size={18}/><span>Previous</span></button>
      <span className="menu-page-counter">{String(page + 1).padStart(2, '0')} <i>/</i> {String(menuPages.length).padStart(2, '0')}</span>
      <button aria-label="Next menu page" onClick={() => turnPage(1)} disabled={page === menuPages.length - 1}><span>Next page</span><ArrowRight size={18}/></button>
    </nav>
  </main>;
}
