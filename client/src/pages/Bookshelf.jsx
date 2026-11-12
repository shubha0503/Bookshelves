import React, { useEffect, useState } from 'react';
import BookNook from '../components/BookNook';
import { getPublicShelf } from '../services/bookService';

export default function Bookshelf({ onBack }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getPublicShelf().then(response => {
      if (cancelled) return;
      setBooks((response.data?.books || []).map(({ id, title, author, review }) => ({ id, title, author, review })));
    }).catch(() => {
      if (!cancelled) setError('The shelves could not be reached. Please check the café connection.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <main className="booknook-page booknook-state"><span className="tiny-label">A MOMENT, PLEASE</span><h1>Setting the books out…</h1><div className="loading-book"/></main>;
  if (error) return <main className="booknook-page booknook-state"><button className="back-link" onClick={onBack}>← Back inside</button><h1>We couldn't reach the shelves.</h1><p>{error}</p></main>;
  return <BookNook books={books} onBack={onBack}/>;
}
