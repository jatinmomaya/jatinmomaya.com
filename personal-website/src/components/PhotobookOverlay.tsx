'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhotobookChapter, PhotobookPhoto } from './photobook/chapters';
import { warmChapterPhotos } from './photobook/chapters';
import { playCloseAnimation, playOpenAnimation, playPageTurn } from './anim';
import { COMPACT_QUERY } from './designTokens';
import styles from '../app/photobook.module.css';

interface PhotobookOverlayProps {
  chapter: PhotobookChapter;
  /** Viewport point the book grows from (the book's position on the shelf). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

function PhotoPage({
  photo,
  onZoom,
}: {
  photo: PhotobookPhoto;
  onZoom: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <figure className={styles.page}>
      <button
        type="button"
        className={styles.photoButton}
        onClick={onZoom}
        aria-label={`View ${photo.alt} full screen`}
      >
        <img
          src={photo.src}
          alt={photo.alt}
          className={styles.photo}
          width={photo.width}
          height={photo.height}
          loading="eager"
        />
      </button>
      <figcaption className={styles.caption}>{photo.caption}</figcaption>
    </figure>
  );
}

/**
 * A photobook chapter, opened: a full-screen book overlay.
 *
 * Desktop shows two-page spreads; narrow/short screens show one page at a
 * time. A photo can be opened into a full-screen lightbox. The overlay grows
 * out of the book's position on the shelf and shrinks back on close.
 *
 * Focus contract: focus moves into the dialog on open, Tab cycles inside it,
 * and focus returns to the book on close (handled by the caller).
 */
export default function PhotobookOverlay({ chapter, origin, onClose }: PhotobookOverlayProps) {
  const photos = chapter.photos;
  // 0 = cover, 1..N = photos, N+1 = end page
  const LAST_PAGE = photos.length + 1;
  const [page, setPage] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lightboxOpener = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setIsCompact(mq.matches);
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

  const step = isCompact ? 1 : 2;

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
    const book = bookRef.current;
    if (book) playCloseAnimation(book).then(onClose);
    else onClose();
  }, [onClose, reducedMotion]);

  // 3D book-opening animation on mount (anime.js timeline).
  useEffect(() => {
    if (bookRef.current) playOpenAnimation(bookRef.current, origin);
    // origin is fixed for the overlay's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Page turn: the fresh spread tilts in.
  useEffect(() => {
    if (spreadRef.current) playPageTurn(spreadRef.current);
  }, [page]);

  // Lock body scroll and focus the dialog while open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Lightbox focus: move in on open, return to the photo button on close.
  useEffect(() => {
    if (lightbox !== null) {
      lightboxCloseRef.current?.focus();
    } else if (lightboxOpener.current) {
      lightboxOpener.current.focus();
      lightboxOpener.current = null;
    }
  }, [lightbox]);

  const openLightbox = useCallback((index: number, opener: HTMLElement) => {
    lightboxOpener.current = opener;
    setLightbox(index);
  }, []);

  // Prefetch neighbors so page turns don't stall on slow networks.
  useEffect(() => {
    const warm: number[] = [];
    for (let p = page - 1; p <= page + 2; p++) {
      if (p >= 1 && p <= photos.length) warm.push(p - 1);
    }
    warmChapterPhotos(chapter, warm);
  }, [chapter, page]);

  // Keyboard: arrows turn pages, Tab is trapped, Escape backs out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox !== null) setLightbox(null);
        else requestClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        if (lightbox !== null) setLightbox(Math.min(photos.length - 1, lightbox + 1));
        else next();
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (lightbox !== null) setLightbox(Math.max(0, lightbox - 1));
        else prev();
        return;
      }
      if (e.key === 'Tab') {
        // Trap focus in the topmost layer (lightbox, else the book).
        const scope = lightbox !== null ? lightboxRef.current : bookRef.current;
        if (!scope) return;
        const focusables = Array.from(
          scope.querySelectorAll<HTMLElement>('button:not([disabled])'),
        ).filter((el) => el.getClientRects().length > 0);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, next, prev, requestClose]);

  // Swipe: track the gesture's full lifecycle so a swipe never also fires
  // the synthetic click (which would open the lightbox or double-turn).
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiped.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    if (Math.abs(e.touches[0].clientX - touchStartX.current) > 10) swiped.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    if (lightbox !== null) {
      setLightbox(Math.max(0, Math.min(photos.length - 1, lightbox + (dx < 0 ? 1 : -1))));
      return;
    }
    if (dx < 0) next();
    else prev();
  };
  const onTouchCancel = () => {
    touchStartX.current = null;
    swiped.current = false;
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
      swiped.current = false;
    }
  };

  const spreadLabel =
    page === 0
      ? 'Cover'
      : page === LAST_PAGE
        ? 'End'
        : isCompact
          ? `Photo ${page} of ${photos.length}`
          : `Pages ${page}${page + 1 <= photos.length ? `–${page + 1}` : ''}`;

  const renderPages = () => {
    if (page === 0) {
      return (
        <div className={styles.titlePage}>
          <p className={styles.kicker}>A photobook</p>
          <h2 className={styles.bookTitle}>{chapter.title}</h2>
          <p className={styles.bookDates}>{chapter.subtitle}</p>
          <p className={styles.hint}>Tap the edge of a page to turn it</p>
          <p className={styles.hintMobile}>Swipe or tap the edges to turn the page</p>
        </div>
      );
    }
    if (page === LAST_PAGE) {
      return (
        <div className={styles.titlePage}>
          <p className={styles.kicker}>Fin</p>
          <p className={styles.bookDates}>
            {photos.length} photographs · {chapter.subtitle}
          </p>
          <button type="button" className={styles.closeBook} onClick={requestClose}>
            Close the book
          </button>
        </div>
      );
    }
    const left = photos[page - 1];
    const right = !isCompact && page < photos.length ? photos[page] : null;
    return (
      <>
        <PhotoPage photo={left} onZoom={(e) => openLightbox(page - 1, e.currentTarget)} />
        {right && <PhotoPage photo={right} onZoom={(e) => openLightbox(page, e.currentTarget)} />}
      </>
    );
  };

  return (
    <div
      ref={dialogRef}
      className={`${styles.overlay} ${closing ? styles.closing : ''} ${reducedMotion ? styles.noMotion : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.title} photobook`}
      tabIndex={-1}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      onClickCapture={onClickCapture}
    >
      <div className={styles.scrim} onClick={requestClose} aria-hidden="true" />

      <div
        ref={bookRef}
        className={styles.book}
        aria-hidden={lightbox !== null}
      >
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

        <div ref={spreadRef} className={styles.spread} key={page} aria-label={spreadLabel}>{renderPages()}</div>

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
        <div ref={lightboxRef} className={styles.lightbox} onClick={() => setLightbox(null)}>
          <img
            src={photos[lightbox].src}
            alt={photos[lightbox].alt}
            className={styles.lightboxPhoto}
            width={photos[lightbox].width}
            height={photos[lightbox].height}
            onClick={(e) => e.stopPropagation()}
          />
          <p className={styles.lightboxCaption}>{photos[lightbox].caption}</p>
          <button
            ref={lightboxCloseRef}
            type="button"
            className={styles.close}
            onClick={() => setLightbox(null)}
            aria-label={`Back to the book, ${photos[lightbox].alt}`}
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
              setLightbox(Math.min(photos.length - 1, lightbox + 1));
            }}
            disabled={lightbox === photos.length - 1}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
