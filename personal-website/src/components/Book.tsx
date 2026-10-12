'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
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
 * - Hover (fine pointers): cover opens after the intent delay; leaving
 *   closes immediately.
 * - Touch (no hover): first tap reveals the cover with a "go" cue, second
 *   tap follows the link.
 * - Keyboard: focusing the link reveals its cover at once; Enter follows
 *   it; Escape closes and drops focus (handled by Bookshelf).
 */
export default function Book({ book, cover, peek, open, onOpen, onSelect }: BookProps) {
  const [touchOnly, setTouchOnly] = useState(false);
  const [hoverRevealed, setHoverRevealed] = useState(false);
  const [focusRevealed, setFocusRevealed] = useState(false);
  const intentTimer = useRef<number | null>(null);

  useEffect(() => {
    setTouchOnly(window.matchMedia('(hover: none)').matches);
  }, []);

  useEffect(
    () => () => {
      if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
    },
    [],
  );

  const revealed = hoverRevealed || focusRevealed || open || peek;
  // aria-expanded reports the user's own reveal, not the intro peek.
  const expanded = hoverRevealed || focusRevealed || open;

  const handleMouseEnter = () => {
    if (touchOnly) return;
    if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
    intentTimer.current = window.setTimeout(() => setHoverRevealed(true), HOVER_INTENT_MS);
  };

  const handleMouseLeave = () => {
    if (intentTimer.current !== null) window.clearTimeout(intentTimer.current);
    setHoverRevealed(false);
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (touchOnly && !open) {
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
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
    </a>
  );
}
