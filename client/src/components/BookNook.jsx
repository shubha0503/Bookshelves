import React, { useState } from 'react';
import { ArrowLeft, BookOpen, X } from 'lucide-react';
import BookCover from './BookCover';
import { getBookCoverOverride } from '../data/bookCoverOverrides';

export default function BookNook({ books, onBack }) {
  const [selected, setSelected] = useState(null);

  return <main className="booknook-page immersive-booknook">
    <button className="booknook-back" onClick={onBack}><ArrowLeft size={16}/> Back inside</button>
    {books.length ? <section className="book-cover-gallery" aria-label="Book cover collection">
      <div className="book-gallery-scroll">
        {Array.from({ length: Math.ceil(books.length / 4) }, (_, rowIndex) => <div className="book-gallery-row" key={`shelf-${rowIndex}`}>
          <div className="book-gallery-track">
            {books.slice(rowIndex * 4, rowIndex * 4 + 4).map(book => <button className="book-cover-card" key={book.id || book.title} onClick={() => setSelected(book)} aria-label={`Open ${book.title} by ${book.author}`}>
              <span className="book-cover-art"><BookCover title={book.title} author={book.author} coverUrl={getBookCoverOverride(book.title)} /></span>
            </button>)}
          </div>
          <div className="book-gallery-shelf" aria-hidden="true" />
        </div>)}
      </div>
    </section> : <section className="shelf-empty"><BookOpen size={27}/><h2>No books are on this shelf yet</h2></section>}
    {selected && <div className="book-journal-overlay" role="presentation" onClick={() => setSelected(null)}><article className="book-review-note" role="dialog" aria-modal="true" aria-label="My review" onClick={event => event.stopPropagation()}><button className="journal-close" onClick={() => setSelected(null)} aria-label="Close review"><X/></button><p>{selected.review?.trim() || 'I haven’t added a review for this book yet.'}</p></article></div>}
  </main>;
}
