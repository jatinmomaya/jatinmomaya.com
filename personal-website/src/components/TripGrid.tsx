'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { loadTrip, photoUrl, srcSet, type Trip, type TripPhoto, type TripSummary } from '../lib/trips';
import PhotoViewer from './PhotoViewer';
import { useOverlayDialog } from './useOverlayDialog';
import { playPageTurn } from './anim';
import styles from '../app/photobook.module.css';

interface TripGridProps {
  /** what the home page already knows, so the book has a title at once */
  summary: TripSummary;
  /** Viewport point the book grows from (the item that opened it). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

const WIDE = '(min-width: 760px) and (min-aspect-ratio: 1/1)';
/** Frames on every page, on every screen: 2 across, 3 down. The last page may hold fewer. */
const PER_PAGE = 6;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-24" as "Sep 24". Built by hand so it never shifts with the viewer's time zone. */
function shortDate(taken?: string): string {
  const m = taken?.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return m ? `${SHORT_MONTHS[Number(m[1]) - 1]} ${Number(m[2])}` : '';
}

/**
 * A trip, opened as a photo book: contact-sheet pages of small frames, each
 * numbered and dated. Two pages side by side on a wide screen, one on a phone.
 * The full photo list is its own small chunk and loads when the book opens;
 * a frame opens the photo on a lit tabletop.
 */
export default function TripGrid({ summary, origin, onClose }: TripGridProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [viewer, setViewer] = useState<{ index: number; from: DOMRect | null } | null>(null);
  const [wide, setWide] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia(WIDE).matches));
  const [pageIdx, setPageIdx] = useState(0);
  const spreadRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const turned = useRef(false);
  const { closing, dialogRef, requestClose } = useOverlayDialog(origin, onClose, { active: viewer === null });

  useEffect(() => {
    let live = true;
    loadTrip(summary.id).then((t) => live && setTrip(t));
    return () => {
      live = false;
    };
  }, [summary.id]);

  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Six frames to a page, always: 34 photos make 6 pages (the last holds 4), 19 make 4 pages
  // (the last holds 1). The same on both trips and on every screen.
  const total = trip?.photos.length ?? summary.count;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const starts = useMemo(() => Array.from({ length: pageCount + 1 }, (_, p) => Math.min(p * PER_PAGE, total)), [total, pageCount]);
  const span = wide ? 2 : 1;
  const rawPage = Math.min(pageIdx, pageCount - 1);
  const page = wide ? rawPage - (rawPage % 2) : rawPage; // a spread starts on an odd page number
  const pages = useMemo(() => {
    if (!trip) return [] as { n: number; tiles: { photo: TripPhoto; index: number }[] }[];
    return Array.from({ length: span }, (_, k) => page + k)
      .filter((p) => p < pageCount)
      .map((p) => ({
        n: p + 1,
        tiles: trip.photos.slice(starts[p], starts[p + 1]).map((photo, i) => ({ photo, index: starts[p] + i })),
      }));
  }, [trip, page, span, starts, pageCount]);
  const pageOf = useCallback((index: number) => Math.max(0, starts.findIndex((st, p) => index >= st && index < starts[p + 1])), [starts]);

  const turn = useCallback(
    (dir: 1 | -1) => {
      const next = Math.min(pageCount - 1, Math.max(0, page + dir * span));
      if (next === page) return;
      turned.current = true;
      setPageIdx(next);
    },
    [page, span, pageCount],
  );

  // the new page tilts in like a turning page
  useEffect(() => {
    if (!turned.current) return;
    turned.current = false;
    if (spreadRef.current) playPageTurn(spreadRef.current);
  }, [page]);

  // arrow keys turn the page while no photo is open (the dialog hook handles Escape and Tab)
  useEffect(() => {
    if (viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [viewer, turn]);

  const onPointerDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) turn(dx < 0 ? 1 : -1);
  };

  // closing the viewer returns focus to the frame it came from, and the book shows that frame's page
  const closeViewer = useCallback(() => {
    const id = trip && viewer ? trip.photos[viewer.index]?.id : null;
    setViewer(null);
    window.setTimeout(() => {
      if (id) spreadRef.current?.querySelector<HTMLElement>(`[data-photo="${id}"]`)?.focus();
    }, 0);
  }, [trip, viewer]);

  const moveViewer = useCallback((i: number) => {
    setViewer((v) => (v ? { ...v, index: i } : v));
    setPageIdx(pageOf(i));
  }, [pageOf]);

  const first1 = pages[0]?.tiles[0]?.index ?? 0;
  const last1 = pages.length ? pages[pages.length - 1].tiles.slice(-1)[0]?.index ?? 0 : 0;

  return (
    <>
      <div className={`${styles.overlay}${closing ? ` ${styles.closing}` : ''}`}>
        <div className={styles.scrim} onClick={requestClose} aria-hidden="true" />
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="trip-title" tabIndex={-1} className={styles.book}>
          <button type="button" className={styles.close} onClick={requestClose} aria-label="Close the book">
            &times;
          </button>
          <div className={styles.cover}>
            <div ref={spreadRef} className={styles.spread} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
              {(trip ? pages : [{ n: 1, tiles: [] as { photo: TripPhoto; index: number }[] }]).map((pg, k) => {
                const left = k === 0;
                return (
                  <section key={pg.n} className={`${styles.page} ${left && wide ? styles.left : ''} ${!left ? styles.right : ''}`} aria-label={`Page ${pg.n}`}>
                    <header className={styles.head}>
                      {left ? (
                        <h2 id="trip-title" className={styles.title}>{summary.title}</h2>
                      ) : (
                        <span className={styles.meta}>
                          {summary.when ? `${summary.when} · ` : ''}
                          {summary.count} photographs
                        </span>
                      )}
                      {left && !wide && (
                        <span className={styles.meta}>
                          {summary.when ? `${summary.when} · ` : ''}
                          {summary.count} photographs
                        </span>
                      )}
                    </header>
                    <div className={styles.frames}>
                      <div className={styles.sheet}>
                      {pg.tiles.map(({ photo, index }) => (
                        <button
                          key={photo.id}
                          type="button"
                          className={styles.frame}
                          data-photo={photo.id}
                          title={photo.caption || undefined}
                          aria-label={`Photo ${index + 1} of ${summary.count}: ${[photo.caption || photo.alt, shortDate(photo.taken)].filter(Boolean).join(', ')}`}
                          onClick={(e) => {
                            const film = e.currentTarget.querySelector('[data-film]');
                            setViewer({ index, from: (film ?? e.currentTarget).getBoundingClientRect() });
                          }}
                        >
                          <span className={styles.film} data-film style={{ '--bg': photo.bg } as CSSProperties}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoUrl(trip!.id, photo, photo.widths[0])}
                              srcSet={srcSet(trip!.id, photo, 800)}
                              sizes="260px"
                              alt=""
                              width={photo.w}
                              height={photo.h}
                              loading="lazy"
                              decoding="async"
                            />
                          </span>
                          <span className={styles.no}>
                            <b>{String(index + 1).padStart(2, '0')}</b>
                            <i>{shortDate(photo.taken)}</i>
                          </span>
                        </button>
                      ))}
                      </div>
                    </div>
                    <footer className={styles.folio}>{pg.n}</footer>
                  </section>
                );
              })}
            </div>
          </div>
          <nav className={styles.turn} aria-label="Pages">
            <button type="button" onClick={() => turn(-1)} disabled={page === 0} aria-label="Previous page">&lsaquo;</button>
            <span aria-live="polite">{trip ? (first1 === last1 ? `${first1 + 1}` : `${first1 + 1}–${last1 + 1}`) : ''} of {summary.count}</span>
            <button type="button" onClick={() => turn(1)} disabled={page + span >= pageCount} aria-label="Next page">&rsaquo;</button>
          </nav>
        </div>
      </div>
      {trip && viewer && (
        <PhotoViewer trip={trip} index={viewer.index} from={viewer.from} onIndex={moveViewer} onClose={closeViewer} />
      )}
    </>
  );
}
