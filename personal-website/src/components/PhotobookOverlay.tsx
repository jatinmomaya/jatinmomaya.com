'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MEXICO_PHOTOS,
  PHOTOBOOK_DATES,
  PHOTOBOOK_TITLE,
  type PhotobookPhoto,
} from './photobook/mexico';
import styles from '../app/photobook.module.css';

interface PhotobookOverlayProps {
  /** Viewport point the book grows from (the Photos book's position). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

const LAST_PAGE = MEXICO_PHOTOS.length + 1; // 0 = cover, 1..20 photos, 21 = end

function PhotoPage({ photo, onZoom }: { photo: PhotobookPhoto; onZoom: () => void }) {
  return (
    <figure className={styles.page}>
      <button
        type="button"
        className={styles.photoButton}
        onClick={onZoom}
        aria-label={`View ${photo.alt} full screen`}
      >
        <img src={photo.src} alt={photo.alt} className={styles.photo} loading="lazy" />
      </button>
      <figcaption className={styles.caption}>{photo.caption}</figcaption>
    </figure>
  );
}

/**
 * The Photos book, opened: a full-screen photobook overlay.
 *
 * Desktop shows two-page spreads; narrow screens show one page at a time.
 * A photo can be opened into a full-screen lightbox. The overlay grows out
 * of the book's position on the shelf and shrinks back on close.
 */
export default function PhotobookOverlay({ origin, onClose }: PhotobookOverlayProps) {
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setIsMobile(mq.matches);
      setReducedMotion(rm.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    rm.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      rm.removeEventListener('change', sync);
    };
  }, []);

  const step = isMobile ? 1 : 2;

  const goTo = useCallback(
    (next: number) => setPage(Math.max(0, Math.min(LAST_PAGE, next))),
    [],
  );
  const next = useCallback(() => goTo(page + step), [goTo, page, step]);
  const prev = useCallback(() => goTo(page - step), [goTo, page, step]);

  const requestClose = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [onClose, reducedMotion]);

  // Lock body scroll and focus the dialog while open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Keyboard: arrows turn pages, Escape backs out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox !== null) setLightbox(null);
        else requestClose();
      } else if (e.key === 'ArrowRight') {
        if (lightbox !== null) setLightbox(Math.min(MEXICO_PHOTOS.length - 1, lightbox + 1));
        else next();
      } else if (e.key === 'ArrowLeft') {
        if (lightbox !== null) setLightbox(Math.max(0, lightbox - 1));
        else prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, next, prev, requestClose]);

  // Swipe to turn pages.
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 48 || lightbox !== null) return;
    if (dx < 0) next();
    else prev();
  };

  const spreadLabel =
    page === 0
      ? 'Cover'
      : page === LAST_PAGE
        ? 'End'
        : isMobile
          ? `Photo ${page} of ${MEXICO_PHOTOS.length}`
          : `Pages ${page}${page + 1 <= MEXICO_PHOTOS.length ? `–${page + 1}` : ''}`;

  const renderPages = () => {
    if (page === 0) {
      return (
        <div className={styles.titlePage}>
          <p className={styles.kicker}>A photobook</p>
          <h2 className={styles.bookTitle}>{PHOTOBOOK_TITLE}</h2>
          <p className={styles.bookDates}>{PHOTOBOOK_DATES}</p>
          <p className={styles.hint}>Tap the edge of a page to turn it</p>
        </div>
      );
    }
    if (page === LAST_PAGE) {
      return (
        <div className={styles.titlePage}>
          <p className={styles.kicker}>Fin</p>
          <p className={styles.bookDates}>
            {MEXICO_PHOTOS.length} photographs · {PHOTOBOOK_DATES}
          </p>
        </div>
      );
    }
    const left = MEXICO_PHOTOS[page - 1];
    const right = !isMobile && page < MEXICO_PHOTOS.length ? MEXICO_PHOTOS[page] : null;
    return (
      <>
        <PhotoPage photo={left} onZoom={() => setLightbox(page - 1)} />
        {right && <PhotoPage photo={right} onZoom={() => setLightbox(page)} />}
      </>
    );
  };

  const originStyle = origin
    ? ({ '--ox': `${origin.x}px`, '--oy': `${origin.y}px` } as React.CSSProperties)
    : undefined;

  return (
    <div
      ref={dialogRef}
      className={`${styles.overlay} ${closing ? styles.closing : ''} ${reducedMotion ? styles.noMotion : ''}`}
      style={originStyle}
      role="dialog"
      aria-modal="true"
      aria-label={`${PHOTOBOOK_TITLE} photobook`}
      tabIndex={-1}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className={styles.scrim} onClick={requestClose} aria-hidden="true" />

      <div className={styles.book} key={page} role="document" aria-label={spreadLabel}>
        <button type="button" className={styles.close} onClick={requestClose} aria-label="Close photobook">
          ×
        </button>

        <button
          type="button"
          className={`${styles.turn} ${styles.turnPrev}`}
          onClick={prev}
          disabled={page === 0}
          aria-label="Previous page"
        >
          ‹
        </button>

        <div className={styles.spread}>{renderPages()}</div>

        <button
          type="button"
          className={`${styles.turn} ${styles.turnNext}`}
          onClick={next}
          disabled={page === LAST_PAGE}
          aria-label="Next page"
        >
          ›
        </button>

        <p className={styles.pageLabel} aria-live="polite">
          {spreadLabel}
        </p>
      </div>

      {lightbox !== null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${MEXICO_PHOTOS[lightbox].alt}, full screen`}
          onClick={() => setLightbox(null)}
        >
          <img
            src={MEXICO_PHOTOS[lightbox].src}
            alt={MEXICO_PHOTOS[lightbox].alt}
            className={styles.lightboxPhoto}
            onClick={(e) => e.stopPropagation()}
          />
          <p className={styles.lightboxCaption}>{MEXICO_PHOTOS[lightbox].caption}</p>
          <button
            type="button"
            className={styles.close}
            onClick={() => setLightbox(null)}
            aria-label="Back to the book"
          >
            ×
          </button>
          <button
            type="button"
            className={`${styles.turn} ${styles.turnPrev} ${styles.onDark}`}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(Math.max(0, lightbox - 1));
            }}
            disabled={lightbox === 0}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.turn} ${styles.turnNext} ${styles.onDark}`}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(Math.min(MEXICO_PHOTOS.length - 1, lightbox + 1));
            }}
            disabled={lightbox === MEXICO_PHOTOS.length - 1}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
