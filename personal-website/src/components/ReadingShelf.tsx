'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { formatFinished, type ShelfBook } from '../lib/books';
import { bloomPose, springBook } from './anim';
import SpineFace from './SpineFace';
import { useShelfFocus } from './useShelfFocus';
import styles from '../app/shelf.module.css';

// The full list only exists after a tap, so it stays out of first paint.
const AllBooksOverlay = dynamic(() => import('./AllBooksOverlay'), { ssr: false });

/** Room the row keeps for the two bookends and the "All books" stack, in units. */
const RESERVED_UNITS = 140;

function label(book: ShelfBook): string {
  const parts = [`${book.title} by ${book.author}`];
  if (book.status === 'reading') parts.push('reading now');
  if (book.favorite) parts.push('favorite');
  if (book.rating) parts.push(`${book.rating} out of 5`);
  return parts.join(', ');
}

interface ReadingBookProps {
  book: ShelfBook;
  bloom: number;
  shift: number;
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  onKeyFocus: () => void;
  onBlur: () => void;
}

/** One book on the shelf. */
function ReadingBook({ book, bloom, shift, onPointerDown, onClick, onKeyFocus, onBlur }: ReadingBookProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (ref.current) springBook(ref.current, bloomPose(bloom, shift));
  }, [bloom, shift]);

  const className = [styles.book, bloom > 0.5 ? styles.revealed : ''].filter(Boolean).join(' ');
  const style = { '--w': book.width, '--h': book.height, '--c': book.color, '--ink': book.ink } as CSSProperties;

  return (
    <button
      type="button"
      ref={ref}
      data-book={book.id}
      data-shelf-book
      className={className}
      style={style}
      aria-label={label(book)}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onFocus={(e) => {
        if (e.currentTarget.matches(':focus-visible')) onKeyFocus();
      }}
      onBlur={onBlur}
    >
      <SpineFace title={book.title} />
      {book.favorite && <span className={styles.favBand} aria-hidden="true" />}
      {book.status === 'reading' && <span className={styles.ribbon} aria-hidden="true" />}
      <span className={styles.cover} data-cover aria-hidden="true" style={{ opacity: bloom }}>
        <span className={styles.typeset}>
          <span className={styles.typesetTitle}>{book.title}</span>
          <span className={styles.typesetAuthor}>{book.author}</span>
        </span>
        {book.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.coverImg}
            src={`/books/covers/${book.id}.webp`}
            alt=""
            width={240}
            height={360}
            decoding="async"
          />
        )}
      </span>
    </button>
  );
}

interface CardPos {
  book: ShelfBook;
  x: number;
  y: number;
}

interface ReadingShelfProps {
  /** the most recent books, in shelf order; the row trims this to fit */
  books: ShelfBook[];
  /** how many books are in the full list */
  total: number;
}

/**
 * The shelf: what I'm reading and what I've finished. Spines are derived
 * from the data (no image per book). The row shows as many recent books as
 * fit; the stack at the end opens the full list.
 */
export default function ReadingShelf({ books, total }: ReadingShelfProps) {
  const zoneRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState<number | null>(null);
  const [unitPx, setUnitPx] = useState(1);
  const [heldId, setHeldId] = useState<string | null>(null);
  const [card, setCard] = useState<CardPos | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [allOrigin, setAllOrigin] = useState<{ x: number; y: number } | null>(null);
  const [allFocusId, setAllFocusId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const lastPointerType = useRef('mouse');
  const heldBefore = useRef(false);
  const moved = useRef(false);

  useEffect(() => setMounted(true), []);

  const shown = count === null ? books : books.slice(0, count);
  const ids = shown.map((b) => b.id);
  const shelf = useShelfFocus(ids, rowRef, heldId, {
    rangePx: 96 * unitPx,
    shiftPx: 60 * unitPx,
    stickPx: 12 * unitPx,
  });

  // Trim the row to its width. Measured before paint, so the books appear
  // already fitted; they stay hidden until then.
  useLayoutEffect(() => {
    const zone = zoneRef.current;
    const row = rowRef.current;
    const probe = probeRef.current;
    if (!zone || !row || !probe) return;
    const fit = () => {
      const u = probe.offsetWidth / 100 || 1;
      const cs = getComputedStyle(row);
      const gap = parseFloat(cs.columnGap) || 0;
      // the shelf is as wide as its books, up to the room the zone has
      let room = zone.clientWidth - (parseFloat(cs.paddingLeft) || 0) - RESERVED_UNITS * u;
      let n = 0;
      for (const b of books) {
        const w = b.width * u;
        if (room < w) break;
        room -= w + gap;
        n++;
      }
      setUnitPx(u);
      setCount(n);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(zone);
    return () => ro.disconnect();
  }, [books]);

  // The detail card for the bloomed book. It sits outside the row, so its
  // text stays readable at any scale, and it is clamped to the viewport so
  // edge books never push it off screen.
  const activeId = shelf.activeId;
  useLayoutEffect(() => {
    const book = shown.find((b) => b.id === activeId);
    const hasDetail = book && (book.note || book.rating || book.status === 'reading' || book.favorite || book.finished);
    const li = activeId ? rowRef.current?.querySelector(`[data-book="${activeId}"]`)?.closest('li') : null;
    if (!book || !hasDetail || !li) {
      setCard(null);
      return;
    }
    const r = li.getBoundingClientRect();
    const coverH = li.querySelector<HTMLElement>('[data-cover]')?.offsetHeight ?? 126;
    const half = 88;
    const x = Math.min(Math.max(r.left + r.width / 2, 8 + half), window.innerWidth - 8 - half);
    setCard({ book, x, y: r.bottom - (coverH * 1.18 + 14) - 8 });
    // shown changes identity every render; the active book is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Escape and a tap away put the held book back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeldId(null);
    };
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-shelf-book]')) setHeldId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const openAll = useCallback((el: HTMLElement, focusId: string | null) => {
    const rect = el.getBoundingClientRect();
    opener.current = el;
    setAllOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setAllFocusId(focusId);
    setHeldId(null);
    setAllOpen(true);
  }, []);

  // Focus contract: closing the list returns focus to what opened it.
  const closeAll = useCallback(() => {
    setAllOpen(false);
    const el = opener.current;
    window.setTimeout(() => {
      if (el?.isConnected) el.focus();
    }, 0);
  }, []);

  return (
    <section ref={zoneRef} className={styles.shelf} aria-label="Books">
      <span ref={probeRef} className={styles.probe} aria-hidden="true" />
      <div className={styles.box}>
      <ul
        ref={rowRef}
        aria-label="Books I'm reading and have read"
        className={count === null ? `${styles.row} ${styles.fitting}` : styles.row}
        onPointerMove={shelf.onPointerMove}
        onPointerLeave={shelf.onPointerLeave}
        onTouchMove={(e: TouchEvent<HTMLElement>) => {
          moved.current = true;
          shelf.onTouchMove(e);
        }}
        onTouchEnd={() => {
          shelf.onTouchEnd();
          if (moved.current) setHeldId(null);
          moved.current = false;
        }}
        onTouchCancel={shelf.onTouchEnd}
      >
        <li aria-hidden="true">
          <span className={styles.bookendStart} />
        </li>
        {shown.map((book) => (
          <li key={book.id}>
            <ReadingBook
              book={book}
              bloom={shelf.bloomFor(book.id)}
              shift={shelf.shiftFor(book.id)}
              onPointerDown={(e) => {
                lastPointerType.current = e.pointerType;
                if (e.pointerType !== 'touch') return;
                moved.current = false;
                heldBefore.current = heldId === book.id;
                setHeldId(book.id);
              }}
              onClick={(e) => {
                // Touch: the first tap shows the book, the second opens the list.
                if (lastPointerType.current === 'touch' && !heldBefore.current) return;
                openAll(e.currentTarget, book.id);
              }}
              onKeyFocus={() => setHeldId(book.id)}
              onBlur={() => setHeldId((h) => (h === book.id ? null : h))}
            />
          </li>
        ))}
        <li aria-hidden="true">
          <span className={styles.bookendEnd} />
        </li>
        {total > 0 && (
          <li>
            <button
              type="button"
              className={styles.stack}
              aria-label={`All books, ${total} in the list`}
              onClick={(e) => openAll(e.currentTarget, null)}
            >
              <span className={styles.stackLabel} aria-hidden="true">All books</span>
              <span className={styles.stackBook} style={{ width: 'calc(var(--u) * 44)', background: '#49313a' }} />
              <span className={styles.stackBook} style={{ width: 'calc(var(--u) * 40)', background: '#554a32' }} />
              <span className={styles.stackBook} style={{ width: 'calc(var(--u) * 46)', background: '#2e4a38' }} />
            </button>
          </li>
        )}
      </ul>
      <div className={styles.plankTop} aria-hidden="true" />
      <div className={styles.plank} aria-hidden="true" />
      <div className={styles.plankShadow} aria-hidden="true" />
      </div>
      {card && (
        <div className={styles.card} aria-hidden="true" style={{ left: card.x, top: card.y }}>
          <div className={styles.cardMeta}>
            {[
              card.book.status === 'reading' ? 'Reading now' : formatFinished(card.book.finished),
              card.book.favorite ? 'Favorite' : '',
              card.book.rating ? '★'.repeat(card.book.rating) : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {card.book.note && <p className={styles.cardNote}>{card.book.note}</p>}
        </div>
      )}
      {mounted &&
        allOpen &&
        createPortal(
          <AllBooksOverlay origin={allOrigin} focusId={allFocusId} onClose={closeAll} />,
          document.body,
        )}
    </section>
  );
}
