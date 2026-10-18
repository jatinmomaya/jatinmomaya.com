'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { ShelfBook } from '../lib/books';
import type { TripSummary } from '../lib/trips';
import { stackSlots } from '../data/board';
import { AboutCard, AllTripsCard, LinkCard, Masthead, ResumeCard, WritingPage, type Post } from './BoardItems';
import PhotoStack from './PhotoStack';
import Pinned from './Pinned';
import ReadingShelf from './ReadingShelf';
import { useTripHost } from './useTripHost';
import studio from '../app/studio.module.css';
import board from '../app/board.module.css';

// The About page only exists after a tap, so it stays out of first paint.
const AboutOverlay = dynamic(() => import('./AboutOverlay'), { ssr: false });

interface StudioProps {
  /** recent books for the shelf, in shelf order */
  shelfBooks: ShelfBook[];
  totalBooks: number;
  /** the newest trips, as many as the board shows */
  trips: TripSummary[];
  posts: Post[];
}

type Origin = { x: number; y: number };

/**
 * The homepage: a corkboard of things pinned up, and a shelf of books under
 * it. Everything on the board is also navigation: each trip is a stack of
 * prints that opens as a grid, the About card opens About, the rest are links.
 */
export default function Studio({ shelfBooks, totalBooks, trips, posts }: StudioProps) {
  const [mounted, setMounted] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { openTrip, host } = useTripHost();

  useEffect(() => setMounted(true), []);

  // Focus contract: closing an overlay returns focus to what opened it.
  const openAbout = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    opener.current = el;
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setAboutOpen(true);
  }, []);
  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    const el = opener.current;
    window.setTimeout(() => {
      if (el?.isConnected) el.focus();
    }, 0);
  }, []);

  const slots = stackSlots(trips.length);

  return (
    <div className={studio.studio}>
      <main className={studio.stage}>
        <div className={studio.wallFx} aria-hidden="true" />
        <div className={board.board}>
          <div className={board.frame} aria-hidden="true" />
          <div className={board.cork} aria-hidden="true" />
          <div className={board.pins}>
            <Masthead />
            <AllTripsCard />
            {trips.map((trip, i) => (
              <Pinned key={trip.id} slot={slots[i]} pin={null} span={trips.length === 1 ? 2 : undefined} className={`${board.bare} ${board.stackSlot}`}>
                <PhotoStack trip={trip} position={i} onOpen={openTrip} />
              </Pinned>
            ))}
            {posts.length > 0 && <WritingPage posts={posts} />}
            <AboutCard onOpen={openAbout} />
            <LinkCard id="linkedin" />
            <LinkCard id="github" />
            <ResumeCard />
          </div>
        </div>
        <ReadingShelf books={shelfBooks} total={totalBooks} />
      </main>
      <div className={studio.baseboard} aria-hidden="true" />
      <div className={studio.floor} aria-hidden="true" />
      <div className={studio.vignette} aria-hidden="true" />
      {host}
      {mounted && aboutOpen && createPortal(<AboutOverlay origin={origin} onClose={closeAbout} />, document.body)}
    </div>
  );
}
