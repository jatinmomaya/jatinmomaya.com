'use client';

import { useCallback, useEffect, useState } from 'react';
import Book from './Book';
import { BOOK_COVERS } from './BookCovers';
import { INTRO, NAV_BOOKS } from './designTokens';
import styles from '../app/room.module.css';

/**
 * The oak shelf: bookend plus the navigation books, left-anchored with
 * intentional empty space to the right (room to grow).
 *
 * Owns the cross-book interaction state:
 * - staggered one-time intro (each cover peeks left to right),
 * - which book is held open (touch two-tap),
 * - Escape / click-away closes any open cover.
 */
export default function Bookshelf() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);

  // One-time staggered intro; skipped under prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers: number[] = [];
    NAV_BOOKS.forEach((book, i) => {
      timers.push(
        window.setTimeout(() => {
          setPeekId(book.id);
          timers.push(window.setTimeout(() => setPeekId(null), INTRO.peekHoldMs));
        }, INTRO.initialDelayMs + i * INTRO.staggerMs),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const closeAll = useCallback(() => setOpenId(null), []);

  // Escape closes; clicking anywhere outside a book closes.
  // Escape closes any open cover and drops focus so a keyboard-revealed
  // cover does not linger via :focus-visible.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
        const active = document.activeElement as HTMLElement | null;
        if (active && active.closest('[data-book]')) active.blur();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-book]')) closeAll();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [closeAll]);

  return (
    <div className={styles.shelfZone}>
      <nav aria-label="Site sections">
        <p className={styles.visuallyHidden}>
          Three books on a shelf. Each book is a section of the site: hover or tap to see its cover, then open it to visit.
        </p>
        <ul className={styles.shelfRow}>
          <li aria-hidden="true">
            <span className={styles.bookend} />
          </li>
          {NAV_BOOKS.map((book) => {
            const Cover = BOOK_COVERS[book.id];
            return (
              <li key={book.id}>
                <Book
                  book={book}
                  cover={Cover ? <Cover /> : null}
                  peek={peekId === book.id}
                  open={openId === book.id}
                  onOpen={() => setOpenId(book.id)}
                />
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.plank} aria-hidden="true" />
    </div>
  );
}
