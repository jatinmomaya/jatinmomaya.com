'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { NavBook } from './designTokens';
import styles from '../app/room.module.css';

interface BookProps {
  book: NavBook;
  cover: React.ReactNode;
  /** true while the staggered intro is peeking this book */
  peek: boolean;
  /** true while this book's cover is held open (touch two-tap) */
  open: boolean;
  onOpen: () => void;
  /**
   * Optional activation override (Photos book opens the photobook overlay
   * instead of navigating). Receives the click event so the caller can
   * measure the book's position for the grow animation.
   */
  onSelect?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/** Hover-intent delay: a cursor sweep must linger this long to count. */
const HOVER_INTENT_MS = 80;

/**
 * One navigation book: spine on the shelf, cover revealed on interaction.
 *
 * The reveal is owned by React state (not CSS :hover), so the 80ms
 * hover-intent gate applies to the *whole* reveal — cover pop, book lift,
 * and spine dimming — and closing is always instant.
 *
 * Pointer model is classified per event, never once per device: mouse/pen
 * hover reveals after the intent delay; touch taps use the two-tap model
 * (first tap reveals the cover, second activates). This keeps touchscreen
 * laptops — hover-capable AND touch-capable — correct under both inputs.
 * - Keyboard: focusing the link reveals its cover at once; Enter activates;
 *   Escape closes and moves focus to the shelf nav (handled by Bookshelf).
 */
export default function Book({ book, cover, peek, open, onOpen, onSelect }: BookProps) {
  const [hoverRevealed, setHoverRevealed] = useState(false);
  const [focusRevealed, setFocusRevealed] = useState(false);
  const intentTimer = useRef<number | null>(null);
  const lastPointerType = useRef<string>('mouse');

  useEffect(
    () => () => {
      if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
    },
    [],
  );

  const revealed = hoverRevealed || focusRevealed || open || peek;
  // aria-expanded reports the user's own reveal, not the intro peek.
  const expanded = hoverRevealed || focusRevealed || open;

  const handlePointerEnter = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === 'touch') return;
    if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
    intentTimer.current = window.setTimeout(() => setHoverRevealed(true), HOVER_INTENT_MS);
  };

  const handlePointerLeave = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === 'touch') return;
    if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
    setHoverRevealed(false);
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const touchTap = lastPointerType.current === 'touch';
    // Any activation clears a hover reveal so it can never stick.
    setHoverRevealed(false);
    if (touchTap && !open) {
      e.preventDefault();
      onOpen();
      return;
    }
    if (onSelect) {
      e.preventDefault();
      onSelect(e);
    }
  };

  const className = [
    styles.book,
    revealed ? styles.revealed : '',
    open ? styles.open : '',
    peek ? styles.peek : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    '--w': `${book.width}px`,
    '--h': `${book.height}px`,
    '--c': book.spine,
    '--ink': book.ink,
  } as CSSProperties;

  return (
    <a
      href={book.href}
      data-book={book.id}
      className={className}
      style={style}
      aria-label={book.title}
      aria-expanded={expanded}
      aria-describedby={open ? 'book-open-hint' : undefined}
      onClick={handleClick}
      onPointerDown={(e) => {
        lastPointerType.current = e.pointerType;
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={() => setFocusRevealed(true)}
      onBlur={() => setFocusRevealed(false)}
    >
      <span className={styles.spine}>
        <span className={styles.spineTitle}>{book.title}</span>
      </span>
      <span className={styles.cover} aria-hidden="true">
        {cover}
        <span className={styles.go}>→</span>
      </span>
      {open && (
        <span id="book-open-hint" className={styles.visuallyHidden}>
          Cover shown. Activate again to open.
        </span>
      )}
    </a>
  );
}
