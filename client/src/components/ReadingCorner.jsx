import React from 'react';
import { ArrowLeft, BookOpen, Heart } from 'lucide-react';

export default function ReadingCorner({ books, onBack, onBrowse }) {
  const reading = books.filter(book => book.status === 'READING');
  const wishlist = books.filter(book => book.status === 'WANT_TO_READ');
  const favorites = books.filter(book => book.is_favorite);
  const activeLists = [
    { title: 'Currently reading', icon: <BookOpen/>, books: reading },
    { title: 'Personal favorites', icon: <Heart/>, books: favorites },
    { title: 'Reading wishlist', icon: <BookOpen/>, books: wishlist }
  ].filter(list => list.books.length);
  return <main className="reading-corner-page pixel-reading">
    <button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Back to the café</button>
    <section className="corner-heading"><span className="tiny-label">A WINDOW-SEAT SORT OF DAY</span><h1>The Reading Corner</h1><p>A soft chair, a good book, and nowhere else to be.</p></section>
    <div className="corner-scene pixel-corner-scene" role="img" aria-label="Pixel-art reading chair by an autumn window">
      <div className="owner-note pixel-owner-note"><span className="tiny-label">A LITTLE NOTE FROM THE OWNER</span><p>You are amazing human just not cause you are helping make money, you are reading books that make you good human. And i hope you know that you are doing just more than fine. Life may at instances not feel like howw you expected to be, but that's the thing god only throw hardest of things to only one who are the strongest player. So keep smiling and thanks for being kind even at times when life was not kind to you</p></div>
    </div>
    {activeLists.length>0&&<div className="corner-lists">{activeLists.map(list=><ShelfList key={list.title} {...list}/>)}</div>}
  </main>;
}

function ShelfList({ title, icon, books }) {
  return <section className="corner-list"><h2>{icon}{title}</h2>{books.length?<ul>{books.map(book=><li key={book.id}>{book.title}<small> — {book.author}</small></li>)}</ul>:<p>Nothing on this list just yet.</p>}</section>;
}
