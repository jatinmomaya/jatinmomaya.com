'use client';

import { useEffect, useMemo, useState } from 'react';
import booksData from '../data/books.json';
import { finishedYear, formatFinished, sortBooks, type Book } from '../lib/books';
import { useOverlayDialog } from './useOverlayDialog';
import about from '../app/about.module.css';
import styles from '../app/allbooks.module.css';

interface AllBooksOverlayProps {
  /** Viewport point the page grows from (the stack or book that opened it). */
  origin: { x: number; y: number } | null;
  /** A book to scroll to and mark, when opened from a book on the shelf. */
  focusId?: string | null;
  onClose: () => void;
}

const BOOKS = sortBooks(booksData.books as Book[]);

function groupByYear(books: Book[]): { year: string; books: Book[] }[] {
  const groups: { year: string; books: Book[] }[] = [];
  for (const book of books) {
    const year = finishedYear(book.finished) || 'Earlier';
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.books.push(book);
    else groups.push({ year, books: [book] });
  }
  return groups;
}

function Stars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className={styles.stars} role="img" aria-label={`${rating} out of 5`}>
      {'★'.repeat(rating)}
    </span>
  );
}

function Row({ book, marked }: { book: Book; marked: boolean }) {
  return (
    <li className={marked ? `${styles.row} ${styles.marked}` : styles.row} data-book-id={book.id}>
      <div className={styles.rowHead}>
        <span className={styles.title}>{book.title}</span>
        <span className={styles.meta}>
          {book.favorite && <span className={styles.fav}>Favorite</span>}
          <Stars rating={book.rating} />
          {book.finished && <span>{formatFinished(book.finished)}</span>}
        </span>
      </div>
      <div className={styles.author}>{book.author}</div>
      {book.note && <p className={styles.note}>{book.note}</p>}
    </li>
  );
}

/**
 * The full list behind the shelf: what I'm reading, then everything I've
 * finished, newest first. Loaded on demand, so it never touches first paint.
 */
export default function AllBooksOverlay({ origin, focusId = null, onClose }: AllBooksOverlayProps) {
  const { closing, dialogRef, requestClose } = useOverlayDialog(origin, onClose);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const reading = useMemo(() => BOOKS.filter((b) => b.status === 'reading'), []);
  const finished = useMemo(
    () => BOOKS.filter((b) => b.status === 'read' && (!onlyFavorites || b.favorite)),
    [onlyFavorites],
  );
  const groups = useMemo(() => groupByYear(finished), [finished]);

  useEffect(() => {
    if (!focusId) return;
    const row = dialogRef.current?.querySelector<HTMLElement>(`[data-book-id="${focusId}"]`);
    row?.scrollIntoView({ block: 'center' });
  }, [focusId, dialogRef]);

  return (
    <div className={`${about.overlay}${closing ? ` ${about.closing}` : ''}`}>
      <div className={about.scrim} onClick={requestClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Books"
        tabIndex={-1}
        className={about.sheet}
      >
        <button type="button" className={about.close} onClick={requestClose} aria-label="Back to the shelf">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className={about.kicker}>On the shelf</p>
        <p className={about.lede}>What I’m reading now, and everything I’ve finished, newest first.</p>

        {reading.length > 0 && (
          <>
            <div className={about.rule} aria-hidden="true" />
            <h2 className={about.section}>Reading now</h2>
            <ul className={styles.list}>
              {reading.map((b) => (
                <Row key={b.id} book={b} marked={b.id === focusId} />
              ))}
            </ul>
          </>
        )}

        <div className={about.rule} aria-hidden="true" />
        <div className={styles.filters} role="group" aria-label="Filter finished books">
          <button type="button" aria-pressed={!onlyFavorites} onClick={() => setOnlyFavorites(false)}>
            Everything
          </button>
          <button type="button" aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(true)}>
            Favorites
          </button>
        </div>
        {groups.length === 0 && <p className={styles.empty}>Nothing here yet.</p>}
        {groups.map((group) => (
          <section key={group.year}>
            <h2 className={about.section}>{group.year}</h2>
            <ul className={styles.list}>
              {group.books.map((b) => (
                <Row key={b.id} book={b} marked={b.id === focusId} />
              ))}
            </ul>
          </section>
        ))}

        <div className={styles.footer}>
          <button type="button" className={about.back} onClick={requestClose}>
            Back to the shelf
          </button>
        </div>
      </div>
    </div>
  );
}
