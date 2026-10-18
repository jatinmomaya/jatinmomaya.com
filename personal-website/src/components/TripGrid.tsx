'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { formatTaken, justify, loadTrip, photoUrl, srcSet, type Trip, type TripSummary } from '../lib/trips';
import PhotoViewer from './PhotoViewer';
import { useOverlayDialog } from './useOverlayDialog';
import about from '../app/about.module.css';
import styles from '../app/trips.module.css';

interface TripGridProps {
  /** what the board already knows, so the header shows at once */
  summary: TripSummary;
  /** Viewport point the grid grows from (the stack's position). */
  origin: { x: number; y: number } | null;
  onClose: () => void;
}

const GAP = 12;

/**
 * A trip, opened: every photo on a cork board in justified rows. The full
 * photo list loads now (it is its own small chunk); the photos themselves
 * load as rows scroll near. A photo opens full screen.
 */
export default function TripGrid({ summary, origin, onClose }: TripGridProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [viewer, setViewer] = useState<{ index: number; from: DOMRect | null } | null>(null);
  const [width, setWidth] = useState(0);
  const rowsRef = useRef<HTMLDivElement>(null);
  const { closing, dialogRef, requestClose } = useOverlayDialog(origin, onClose, { active: viewer === null });

  useEffect(() => {
    let live = true;
    loadTrip(summary.id).then((t) => live && setTrip(t));
    return () => {
      live = false;
    };
  }, [summary.id]);

  useEffect(() => {
    const el = rowsRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(
    () => (trip ? justify(trip.photos, width, width < 560 ? 130 : 190, GAP) : []),
    [trip, width],
  );

  // Focus contract: closing the viewer returns focus to the photo it came from.
  const closeViewer = useCallback(() => {
    const id = trip && viewer ? trip.photos[viewer.index]?.id : null;
    setViewer(null);
    window.setTimeout(() => {
      if (id) rowsRef.current?.querySelector<HTMLElement>(`[data-photo="${id}"]`)?.focus();
    }, 0);
  }, [trip, viewer]);

  return (
    <>
      <div className={`${about.overlay}${closing ? ` ${about.closing}` : ''}`}>
        <div className={about.scrim} onClick={requestClose} aria-hidden="true" />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-title"
          tabIndex={-1}
          className={styles.panel}
        >
          <button type="button" className={styles.close} onClick={requestClose} aria-label="Back to the board">
            &times;
          </button>
          <div className={styles.corkPane}>
            <div className={styles.head}>
              <h2 id="trip-title" className={styles.title}>{summary.title}</h2>
              <span className={styles.meta}>
                {summary.when ? `${summary.when} · ` : ''}
                {summary.count} photographs
              </span>
            </div>
            <div ref={rowsRef} className={styles.rows}>
              {rows.map((row, r) => (
                <div key={r} className={styles.row}>
                  {row.map(({ photo, index, w, h }) => (
                    <button
                      key={photo.id}
                      type="button"
                      className={styles.tile}
                      data-photo={photo.id}
                      style={{ width: w, height: h, '--bg': photo.bg } as CSSProperties}
                      title={[photo.caption, formatTaken(photo.taken)].filter(Boolean).join(' · ')}
                      aria-label={`Photo ${index + 1} of ${summary.count}: ${[photo.caption || photo.alt, formatTaken(photo.taken)].filter(Boolean).join(', ')}`}
                      onClick={(e) => setViewer({ index, from: e.currentTarget.getBoundingClientRect() })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl(trip!.id, photo, photo.widths[0])}
                        srcSet={srcSet(trip!.id, photo, 800)}
                        sizes={`${Math.round(w)}px`}
                        alt=""
                        width={photo.w}
                        height={photo.h}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {trip && viewer && (
        <PhotoViewer
          trip={trip}
          index={viewer.index}
          from={viewer.from}
          onIndex={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
