'use client';

import Link from 'next/link';
import { photoUrl, srcSet, type TripSummary } from '../lib/trips';
import { useTripHost } from './useTripHost';
import styles from '../app/tripspage.module.css';

/** Every trip, newest first, as an album on the shelf. Opening one opens its photo book. */
export default function TripsPage({ trips }: { trips: TripSummary[] }) {
  const { openTrip, host } = useTripHost();
  const photos = trips.reduce((n, t) => n + t.count, 0);
  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <Link className={styles.back} href="/">
          &larr; Back to the shelf
        </Link>
        <h1 className={styles.title}>Photographs</h1>
        <p className={styles.meta}>
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'} &middot; {photos} photographs
        </p>
        {trips.length ? (
          <ul className={styles.grid}>
            {trips.map((trip) => {
              const cover = trip.stack[0];
              return (
                <li key={trip.id}>
                  <button type="button" className={styles.album} onClick={(e) => openTrip(e, trip)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl(trip.id, cover, cover.widths[0])}
                      srcSet={srcSet(trip.id, cover, 800)}
                      sizes="(max-width: 640px) 90vw, 360px"
                      alt=""
                      width={cover.w}
                      height={cover.h}
                      style={{ background: cover.bg }}
                    />
                    <span>
                      <b>{trip.title}</b>
                      {trip.when} &middot; {trip.count} photographs
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.empty}>No trips yet.</p>
        )}
      </main>
      {host}
    </div>
  );
}
