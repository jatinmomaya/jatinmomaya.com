'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { TripSummary } from '../lib/trips';

// The grid and viewer only exist after a tap, so they stay out of first paint.
const TripGrid = dynamic(() => import('./TripGrid'), { ssr: false });

/**
 * Opens a trip from any stack. Returns `openTrip` for the stacks to call and
 * `host`, which the page renders once. Focus returns to the stack on close.
 */
export function useTripHost(): { openTrip: (e: MouseEvent<HTMLElement>, trip: TripSummary) => void; host: ReactNode } {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<{ trip: TripSummary; origin: { x: number; y: number } } | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const openTrip = useCallback((e: MouseEvent<HTMLElement>, trip: TripSummary) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    opener.current = el;
    setOpen({ trip, origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    const el = opener.current;
    window.setTimeout(() => {
      if (el?.isConnected) el.focus();
    }, 0);
  }, []);

  const host =
    mounted && open
      ? createPortal(<TripGrid summary={open.trip} origin={open.origin} onClose={close} />, document.body)
      : null;
  return { openTrip, host };
}
