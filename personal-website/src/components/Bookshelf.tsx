'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Book from './Book';
import { BOOK_COVERS } from './BookCovers';
import { INTRO, NAV_BOOKS } from './designTokens';
import { getChapter, warmChapterPhotos, type PhotobookChapter } from './photobook/chapters';
import type { ComingSoonKind } from './ComingSoonOverlay';
import styles from '../app/room.module.css';

// The photobook only exists after a tap — keep it out of first paint.
const PhotobookOverlay = dynamic(() => import('./PhotobookOverlay'), { ssr: false });
// Same for the coming-soon placeholder pages.
const ComingSoonOverlay = dynamic(() => import('./ComingSoonOverlay'), { ssr: false });
// The About page is real content — also kept out of first paint.
const AboutOverlay = dynamic(() => import('./AboutOverlay'), { ssr: false });

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
  const [chapter, setChapter] = useState<PhotobookChapter | null>(null);
  const [chapterOpener, setChapterOpener] = useState('photos');
  const [photobookOrigin, setPhotobookOrigin] = useState<{ x: number; y: number } | null>(null);
  const [soonKind, setSoonKind] = useState<ComingSoonKind | null>(null);
  const [soonOrigin, setSoonOrigin] = useState<{ x: number; y: number } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutOrigin, setAboutOrigin] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  // Discrete focus: the pointer (or finger) selects ONE book, which blooms
  // fully and stays bloomed while the pointer is in its zone. Measuring on
  // the untransformed <li> wrappers keeps the focus from chasing the bloom.
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusIdRef = useRef<string | null>(null);
  // Forgive the imprecise second tap: don't treat the pointerdown that
  // follows an open as a click-away dismiss.
  const openedAt = useRef(0);

  useEffect(() => setMounted(true), []);

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

  // Intent preloading: the moment the Photos book shows its cover, warm
  // the first photos so opening the book isn't a cold 4G round trip.
  useEffect(() => {
    if (peekId === 'photos' || openId === 'photos') {
      const mexico = getChapter('mexico');
      if (mexico) warmChapterPhotos(mexico, [0, 1]);
    }
  }, [peekId, openId]);

  const closeAll = useCallback(() => setOpenId(null), []);

  const handleOpen = useCallback((id: string) => {
    openedAt.current = Date.now();
    setOpenId(id);
  }, []);

  // Focus contract: when the photobook closes, focus returns to the
  // book that opened it.
  const closeChapter = useCallback(() => {
    const opener = chapterOpener;
    setChapter(null);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-book="${opener}"]`)?.focus();
    }, 0);
  }, [chapterOpener]);

  // A photobook book opens its chapter overlay in place; it grows out of
  // the book's position on the shelf.
  const openChapter = useCallback(
    (bookId: string, chapterId: string) => (e: MouseEvent<HTMLAnchorElement>) => {
      const next = getChapter(chapterId);
      if (!next) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setPhotobookOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setOpenId(null);
      setChapterOpener(bookId);
      setChapter(next);
    },
    [],
  );

  // Focus contract: when the About page closes, focus returns to the
  // About book that opened it.
  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>('[data-book="about"]')?.focus();
    }, 0);
  }, []);

  // The About book opens the real About page in place; it grows out of
  // the book's position on the shelf.
  const openAbout = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAboutOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setOpenId(null);
    setAboutOpen(true);
  }, []);

  // Focus contract: when the coming-soon page closes, focus returns to
  // the book that opened it.
  const closeSoon = useCallback(() => {
    const kind = soonKind;
    setSoonKind(null);
    window.setTimeout(() => {
      if (kind) document.querySelector<HTMLElement>(`[data-book="${kind}"]`)?.focus();
    }, 0);
  }, [soonKind]);

  // About and Field notes aren't written yet — a placeholder page grows
  // out of the book's position on the shelf.
  const openSoon = useCallback(
    (kind: ComingSoonKind) => (e: MouseEvent<HTMLAnchorElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setSoonOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setOpenId(null);
      setSoonKind(kind);
    },
    [],
  );

  // Escape closes; clicking anywhere outside a book closes.
  // Escape moves focus to the shelf nav so a keyboard-revealed cover
  // closes (focus leaves the link) without dropping focus to <body>.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
        const active = document.activeElement as HTMLElement | null;
        if (active && active.closest('[data-book]')) {
          document.querySelector<HTMLElement>('[data-shelf-nav]')?.focus();
        }
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-book]')) {
        if (Date.now() - openedAt.current < 500) return;
        closeAll();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [closeAll]);

  // Swipe across the shelf: the finger's position drives the same discrete
  // focus as the mouse, so a swipe ripples across the books.
  const handleShelfTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    const t = e.touches[0];
    if (!t) return;
    updateFocus(t.clientX);
  };
  const handleShelfPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return;
    updateFocus(e.clientX);
  };
  const clearFocus = () => updateFocus(null);

  // Bloom geometry: the focused book opens all the way; its immediate
  // neighbors lean in slightly and shift well clear (the bloomed book is
  // ~96px wide once turned).
  const FOCUS_RANGE_PX = 72;
  const FOCUS_STICK_PX = 10; // hysteresis: don't hand off focus on a tie
  const NEIGHBOR_SHIFT_PX = 44;

  // Untransformed centers: the <li> wrappers never move, so the bloom
  // can't chase its own tail.
  const bookCenterX = (id: string): number | null => {
    const li = document.querySelector(`[data-book="${id}"]`)?.closest('li');
    if (!li) return null;
    const rect = li.getBoundingClientRect();
    return rect.left + rect.width / 2;
  };

  const updateFocus = (clientX: number | null) => {
    if (clientX === null) {
      if (focusIdRef.current !== null) {
        focusIdRef.current = null;
        setFocusId(null);
      }
      return;
    }
    let best: { id: string; dist: number } | null = null;
    for (const book of NAV_BOOKS) {
      const cx = bookCenterX(book.id);
      if (cx === null) continue;
      const dist = Math.abs(clientX - cx);
      if (!best || dist < best.dist) best = { id: book.id, dist };
    }
    let next: string | null = null;
    if (best && best.dist <= FOCUS_RANGE_PX) {
      next = best.id;
      const prev = focusIdRef.current;
      if (prev && prev !== next) {
        const pcx = bookCenterX(prev);
        if (pcx !== null && best.dist > Math.abs(clientX - pcx) - FOCUS_STICK_PX) {
          next = prev;
        }
      }
    }
    if (next !== focusIdRef.current) {
      focusIdRef.current = next;
      setFocusId(next);
    }
  };

  const focusIndex = NAV_BOOKS.findIndex((b) => b.id === focusId);
  // Only the focused book blooms; neighbors just part to the sides with a
  // slight tilt. (A partial bloom on neighbors left their wide covers
  // ghosting over each other.)
  const bloomFor = (id: string) => (focusId !== null && id === focusId ? 1 : 0);
  const shiftFor = (id: string) => {
    if (focusId === null || focusId === id) return 0;
    const i = NAV_BOOKS.findIndex((b) => b.id === id);
    return (i < focusIndex ? -1 : 1) * NEIGHBOR_SHIFT_PX;
  };

  return (
    <div className={styles.shelfZone}>
      <nav
        aria-label="Site sections"
        data-shelf-nav
        tabIndex={-1}
        onPointerMove={handleShelfPointerMove}
        onPointerLeave={clearFocus}
        onTouchMove={handleShelfTouchMove}
        onTouchEnd={clearFocus}
        onTouchCancel={clearFocus}
      >
        <p className={styles.visuallyHidden}>
          Three books on a shelf. Each book is a section of the site: hover, tap, or swipe across to see its cover, then open it to visit.
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
                  onOpen={() => handleOpen(book.id)}
                  onSelect={
                    book.id === 'photos'
                      ? openChapter('photos', 'mexico')
                      : book.id === 'about'
                        ? openAbout
                        : book.id === 'field-notes'
                          ? openSoon('field-notes')
                          : undefined
                  }
                  bloom={bloomFor(book.id)}
                  shift={shiftFor(book.id)}
                />
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.shelfDecor} aria-hidden="true">
        <span className={styles.decorBook} style={{ height: 77, background: '#35443a' }} />
        <span className={styles.decorBook} style={{ height: 103, background: '#50312f' }} />
        <span className={`${styles.decorBook} ${styles.decorLean}`} style={{ height: 91, background: '#343b50' }} />
        <span className={styles.decorBook} style={{ height: 69, background: '#51452e' }} />
        <span className={styles.vase} />
      </div>
      <div className={styles.plank} aria-hidden="true" />
      <h1 className={styles.plaque}>Jatin Momaya</h1>
      {mounted &&
        chapter &&
        createPortal(
          <PhotobookOverlay chapter={chapter} origin={photobookOrigin} onClose={closeChapter} />,
          document.body,
        )}
      {mounted &&
        soonKind &&
        createPortal(
          <ComingSoonOverlay kind={soonKind} origin={soonOrigin} onClose={closeSoon} />,
          document.body,
        )}
      {mounted &&
        aboutOpen &&
        createPortal(
          <AboutOverlay origin={aboutOrigin} onClose={closeAbout} />,
          document.body,
        )}
    </div>
  );
}
