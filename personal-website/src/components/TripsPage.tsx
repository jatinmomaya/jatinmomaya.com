'use client';

import Link from 'next/link';
import type { TripSummary } from '../lib/trips';
import PhotoStack from './PhotoStack';
import { useTripHost } from './useTripHost';
import styles from '../app/tripspage.module.css';

/** Every trip, newest first, as stacks on one board. */
export default function TripsPage({ trips }: { trips: TripSummary[] }) {
  const { openTrip, host } = useTripHost();
  const photos = trips.reduce((n, t) => n + t.count, 0);
  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <Link className={styles.back} href="/">
          &larr; Back to the shelf
        </Link>
        <div className={styles.board}>
          <div className={styles.cork}>
            <div className={styles.mast}>
              <h1>Photographs</h1>
              <p>
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} &middot; {photos} photographs
              </p>
            </div>
            {trips.length ? (
              <div className={styles.grid}>
                {trips.map((trip, i) => (
                  <div key={trip.id} className={styles.cell}>
                    <PhotoStack trip={trip} position={i} onOpen={openTrip} />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No trips yet.</p>
            )}
          </div>
        </div>
      </main>
      {host}
    </div>
  );
}
