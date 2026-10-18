'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { bestWidth, formatTaken, photoUrl, srcSet, type Trip } from '../lib/trips';
import { prefersReducedMotion } from './anim';
import styles from '../app/trips.module.css';

interface PhotoViewerProps {
  trip: Trip;
  index: number;
  /** where the photo was on screen, so it can grow out of its place */
  from: DOMRect | null;
  onIndex: (index: number) => void;
  onClose: () => void;
}

/**
 * One photo, full screen. Arrow keys, the buttons or a swipe move between
 * photos; Escape or the close button return to the grid. The full-size file
 * is only requested here, and only the neighbors are preloaded.
 */
export default function PhotoViewer({ trip, index, from, onIndex, onClose }: PhotoViewerProps) {
  const photo = trip.photos[index];
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [closing, setClosing] = useState(false);
  const first = useRef(true);

  // grow out of the grid tile on open
  useEffect(() => {
    closeRef.current?.focus();
    const img = imgRef.current;
    if (!img || !from || prefersReducedMotion()) return;
    const run = () => {
      const to = img.getBoundingClientRect();
      if (!to.width) return;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      img.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width})` }, { transform: 'none' }],
        { duration: 340, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      );
      rootRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    };
    if (img.complete) run();
    else img.addEventListener('load', run, { once: true });
    // only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a short fade when moving between photos
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!prefersReducedMotion()) imgRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
  }, [index]);

  // preload the neighbors, nothing more
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      const p = trip.photos[i];
      if (p) new Image().src = photoUrl(trip.id, p, bestWidth(p, 1200));
    });
  }, [index, trip]);

  // the latest index, so a burst of key presses never steps from a stale one
  const indexRef = useRef(index);
  indexRef.current = index;
  const step = useCallback(
    (d: number) => {
      const n = indexRef.current + d;
      if (n < 0 || n >= trip.photos.length) return;
      indexRef.current = n;
      onIndex(n);
    },
    [trip.photos.length, onIndex],
  );

  // Closing never waits on an animation event, so it works even when animations are paused.
  const requestClose = useCallback(() => {
    if (closing) return;
    const img = imgRef.current;
    if (!img || !from || prefersReducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    const to = img.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    img.animate(
      [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width})` }],
      { duration: 260, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)', fill: 'forwards' },
    );
    rootRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
    window.setTimeout(onClose, 290);
  }, [closing, from, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {
        const buttons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
        if (!buttons.length) return;
        const a = buttons[0], z = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [requestClose, step]);

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={rootRef}
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={`${trip.title}, photo ${index + 1} of ${trip.photos.length}`}
      onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={onPointerUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <button ref={closeRef} type="button" className={styles.vclose} onClick={requestClose} aria-label="Close photo">
        &times;
      </button>
      <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => step(-1)} disabled={index === 0} aria-label="Previous photo">
        &lsaquo;
      </button>
      <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => step(1)} disabled={index === trip.photos.length - 1} aria-label="Next photo">
        &rsaquo;
      </button>
      <figure className={styles.figure} style={{ '--bg': photo.bg } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          key={photo.id}
          src={photoUrl(trip.id, photo, bestWidth(photo, 1200))}
          srcSet={srcSet(trip.id, photo)}
          sizes="94vw"
          alt={photo.alt || photo.caption}
          width={photo.w}
          height={photo.h}
          decoding="async"
        />
        <figcaption>
          {photo.caption}
          {photo.taken && <time dateTime={photo.taken}>{formatTaken(photo.taken)}</time>}
        </figcaption>
      </figure>
      <div className={styles.count} aria-live="polite">
        {index + 1} / {trip.photos.length}
      </div>
    </div>
  );
}
