'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Book from './Book';
import { BOOK_COVERS } from './BookCovers';
import { INTRO, NAV_BOOKS } from './designTokens';
import { warmPhotos } from './photobook/mexico';
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
  const [photobookOpen, setPhotobookOpen] = useState(false);
  const [photobookOrigin, setPhotobookOrigin] = useState<{ x: number; y: number } | null>(null);
  const [soonKind, setSoonKind] = useState<ComingSoonKind | null>(null);
  const [soonOrigin, setSoonOrigin] = useState<{ x: number; y: number } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutOrigin, setAboutOrigin] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  // Swipe-across accordion: the book under the finger reveals like a hover.
  const [touchRevealId, setTouchRevealId] = useState<string | null>(null);
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
    if (peekId === 'photos' || openId === 'photos') warmPhotos([0, 1]);
  }, [peekId, openId]);

  const closeAll = useCallback(() => setOpenId(null), []);

  const handleOpen = useCallback((id: string) => {
    openedAt.current = Date.now();
    setOpenId(id);
  }, []);

  // Focus contract: when the photobook closes, focus returns to the
  // Photos book that opened it.
  const closePhotobook = useCallback(() => {
    setPhotobookOpen(false);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>('[data-book="photos"]')?.focus();
    }, 0);
  }, []);

  // The Photos book opens the photobook overlay in place; it grows out of
  // the book's position on the shelf.
  const openPhotobook = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPhotobookOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setOpenId(null);
    setPhotobookOpen(true);
  }, []);

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

  // Swipe across the shelf: whichever book is under the finger lights up,
  // accordion-style. Pure browse gesture — lifting the finger reveals
  // nothing further; the two-tap model still handles activation.
  const handleShelfTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    const t = e.touches[0];
    if (!t) return;
    const under = document.elementFromPoint(t.clientX, t.clientY)?.closest?.('[data-book]');
    setTouchRevealId(under ? under.getAttribute('data-book') : null);
  };
  const handleShelfTouchEnd = () => setTouchRevealId(null);

  return (
    <div className={styles.shelfZone}>
      <nav
        aria-label="Site sections"
        data-shelf-nav
        tabIndex={-1}
        onTouchMove={handleShelfTouchMove}
        onTouchEnd={handleShelfTouchEnd}
        onTouchCancel={handleShelfTouchEnd}
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
                      ? openPhotobook
                      : book.id === 'about'
                        ? openAbout
                        : book.id === 'field-notes'
                          ? openSoon('field-notes')
                          : undefined
                  }
                  forceReveal={touchRevealId === book.id}
                />
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.plank} aria-hidden="true" />
      {mounted &&
        photobookOpen &&
        createPortal(
          <PhotobookOverlay origin={photobookOrigin} onClose={closePhotobook} />,
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
