import type { CSSProperties, MouseEvent } from 'react';
import { photoUrl, srcSet, type TripSummary } from '../lib/trips';
import board from '../app/board.module.css';
import styles from '../app/stack.module.css';

// Where each layer rests, and where it goes when the stack is fanned.
// Index 0 is the layer closest to the top of the pile; units are artboard units.
const LAYERS = [
  { x: 0, y: 0, r: 1.5, fx: 0, fy: 0, fr: 1.5 },
  { x: -4, y: 0, r: -2.5, fx: -30, fy: 4, fr: -9 },
  { x: 12, y: 4, r: 5, fx: 70, fy: 12, fr: 17 },
  { x: -14, y: 8, r: -7, fx: -74, fy: 14, fr: -19 },
] as const;

const PIN_CLASS = [board.pin, board.pinBlue, board.pinGreen, board.pinBrass];

interface PhotoStackProps {
  trip: TripSummary;
  /** which pin color, so neighbors differ */
  position: number;
  onOpen: (e: MouseEvent<HTMLElement>, trip: TripSummary) => void;
}

/** A pile of prints for one trip. Fills the box it is placed in. */
export default function PhotoStack({ trip, position, onOpen }: PhotoStackProps) {
  // bottom layer first, so the cover ends up on top
  const layers = trip.stack.slice(0, LAYERS.length).map((photo, depth) => ({ photo, depth, L: LAYERS[depth] })).reverse();
  return (
    <button
      type="button"
      className={styles.stack}
      aria-label={`${trip.title}, ${trip.count} photographs. Open the trip.`}
      onClick={(e) => onOpen(e, trip)}
    >
      {layers.map(({ photo, depth, L }) => {
        const top = depth === 0;
        return (
          <span
            key={photo.id}
            className={styles.layer}
            style={{ '--x': L.x, '--y': L.y, '--r': `${L.r}deg`, '--fx': L.fx, '--fy': L.fy, '--fr': `${L.fr}deg`, '--bg': photo.bg } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(trip.id, photo, photo.widths[0])}
              // only the top print is large enough to want a sharper size
              srcSet={top ? srcSet(trip.id, photo, 800) : undefined}
              sizes={top ? '260px' : undefined}
              alt=""
              width={photo.w}
              height={photo.h}
              decoding="async"
            />
            {top && <span className={styles.caption}>{trip.title}</span>}
          </span>
        );
      })}
      <span className={`${PIN_CLASS[position % PIN_CLASS.length]}`} aria-hidden="true" />
      <span className={styles.tape} aria-hidden="true">
        {trip.title}
        <i>{trip.count}</i>
      </span>
    </button>
  );
}
