'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import type { NavBook } from './designTokens';
import styles from '../app/room.module.css';
import { springBook } from './anim';

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
  bloom: number;
  shift: number;
}

/**
 * One navigation book with a continuous shelf driven bloom.
 * Touch taps use the two-tap model, while keyboard focus blooms the cover.
 * - Keyboard: focusing the link reveals its cover at once; Enter activates;
 *   Escape closes and moves focus to the shelf nav (handled by Bookshelf).
 */
export default function Book({ book, cover, peek, open, onOpen, onSelect, bloom: bloomProp, shift }: BookProps) {
  const [focusRevealed, setFocusRevealed] = useState(false);
  const nodeRef = useRef<HTMLAnchorElement>(null);
  const lastPointerType = useRef<string>('mouse');
  const bloom = Math.max(bloomProp, focusRevealed || open || peek ? 1 : 0);
  // Only a meaningfully bloomed book counts as revealed/expanded, so the
  // ripple on neighbors doesn't flip accessibility state.
  const revealed = bloom > 0.5;
  // aria-expanded reports the user's own reveal, not the intro peek.
  const expanded = (focusRevealed || open || bloom > 0.5) && !peek;

  useLayoutEffect(() => {
    if (!nodeRef.current) return;
    springBook(nodeRef.current, {
      translateX: shift,
      translateY: -8 * bloom,
      rotateY: -62 * bloom + (shift === 0 ? 0 : -Math.sign(shift) * 4),
      scale: 1 + 0.05 * bloom,
    });
  }, [bloom, shift]);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const touchTap = lastPointerType.current === 'touch';
    // Any activation clears a hover reveal so it can never stick.
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
      ref={nodeRef}
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
      onFocus={() => setFocusRevealed(true)}
      onBlur={() => setFocusRevealed(false)}
    >
      <span className={styles.spine}>
        <span className={styles.spineTitle}>{book.title}</span>
      </span>
      <span className={styles.cover} aria-hidden="true" style={{ opacity: bloom }}>
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
