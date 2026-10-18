/**
 * Trips and their photos. A trip is one JSON file in src/data/trips/ written
 * and kept up to date by `npm run photos -- <trip-id>` (see scripts/photos.mjs).
 *
 * The homepage only ever receives a TripSummary: the title, the count and the
 * cover photo. The full photo list is a separate chunk that
 * loads when a trip is opened.
 */

export interface TripPhoto {
  id: string;
  w: number;
  h: number;
  /** the day it was taken, YYYY-MM-DD; from the original's EXIF, if it had one */
  taken?: string;
  /** average color, shown while the photo loads */
  bg: string;
  /** the sizes that exist on disk */
  widths: number[];
  caption: string;
  alt: string;
}

export interface Trip {
  id: string;
  title: string;
  /** text shown to visitors, for example "September 2026" */
  when: string;
  /** YYYY-MM, used to sort trips newest first */
  date: string;
  place?: string;
  photos: TripPhoto[];
}

export interface TripSummary {
  id: string;
  title: string;
  when: string;
  date: string;
  count: number;
  /** the photo that stands for the trip */
  cover: TripPhoto;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2025-10-11" as "October 11, 2025". Built by hand so it never shifts with the viewer's time zone. */
export function formatTaken(taken?: string): string {
  const m = taken?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : '';
}

export function photoUrl(tripId: string, photo: TripPhoto, width: number): string {
  return `/photos/${tripId}/${photo.id}-${width}.webp`;
}

/** The smallest size that is at least `atLeast` wide, or the largest there is. */
export function bestWidth(photo: TripPhoto, atLeast: number): number {
  return photo.widths.find((w) => w >= atLeast) ?? photo.widths[photo.widths.length - 1];
}

/** srcset for the sizes up to `maxWidth` (grids never need the full-screen size). */
export function srcSet(tripId: string, photo: TripPhoto, maxWidth = Infinity): string {
  const widths = photo.widths.filter((w) => w <= maxWidth);
  return (widths.length ? widths : photo.widths.slice(0, 1)).map((w) => `${photoUrl(tripId, photo, w)} ${w}w`).join(', ');
}

export function summarize(trip: Trip): TripSummary {
  return {
    id: trip.id,
    title: trip.title,
    when: trip.when,
    date: trip.date,
    count: trip.photos.length,
    cover: trip.photos[0],
  };
}

/** Loads one trip's full photo list. Each trip is its own chunk. */
export async function loadTrip(id: string): Promise<Trip> {
  const mod = await import(`../data/trips/${id}.json`);
  return mod.default as Trip;
}
