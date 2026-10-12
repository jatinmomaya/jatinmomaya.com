'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../app/comingsoon.module.css';

export type ComingSoonKind = 'about' | 'field-notes';

interface ComingSoonOverlayProps {
  kind: ComingSoonKind;
  /** Viewport point the page grows from (the book's position on the shelf). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

const COPY: Record<ComingSoonKind, { kicker: string; title: string; body: string }> = {
  'field-notes': {
    kicker: 'Notebook',
    title: 'Field Notes',
    body: 'The first entries are still being written.',
  },
  about: {
    kicker: 'Author',
    title: 'About',
    body: 'This page is still being written.',
  },
};

/**
 * Placeholder behind the About and Field notes books: a single book page
 * that grows out of the book's position on the shelf.
 *
 * Focus contract: focus moves into the dialog on open and returns to the
 * book on close (handled by the caller).
 */
export default function ComingSoonOverlay({ kind, origin, onClose }: ComingSoonOverlayProps) {
  const [closing, setClosing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copy = COPY[kind];

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(rm.matches);
    sync();
    rm.addEventListener('change', sync);
    return () => rm.removeEventListener('change', sync);
  }, []);

  const requestClose = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 240);
  }, [onClose, reducedMotion]);

  // Lock body scroll, focus the dialog, and close on Escape.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [requestClose]);

  return (
    <div
      className={`${styles.overlay}${closing ? ` ${styles.closing}` : ''}`}
      style={{ '--ox': `${origin?.x ?? 0}px`, '--oy': `${origin?.y ?? 0}px` } as React.CSSProperties}
    >
      <div className={styles.scrim} onClick={requestClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${copy.title} (coming soon)`}
        tabIndex={-1}
        className={styles.sheet}
      >
        <button type="button" className={styles.close} onClick={requestClose} aria-label="Back to the shelf">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <p className={styles.kicker}>{copy.kicker}</p>
        <h2 className={styles.title}>{copy.title}</h2>
        <div className={styles.rule} aria-hidden="true" />
        <p className={styles.body}>{copy.body}</p>
        <button type="button" className={styles.back} onClick={requestClose}>
          Back to the shelf
        </button>
      </div>
    </div>
  );
}
