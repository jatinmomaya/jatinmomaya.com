export interface NavBook {
  id: string;
  title: string;
  /** spine background */
  spine: string;
  /** spine title ink */
  ink: string;
  /** spine dimensions in px */
  width: number;
  height: number;
  href: string;
}

/**
 * The navigation books, left to right. Books stay left-anchored against the
 * bookend; future books append to the right without shifting existing ones.
 * The empty stretch to the right is intentional — room to grow.
 */
export const NAV_BOOKS: NavBook[] = [
  {
    id: 'photos',
    title: 'Photos',
    spine: '#33523f',
    ink: '#f3ead6',
    width: 20,
    height: 84,
    href: '/photography',
  },
  {
    id: 'field-notes',
    title: 'Field notes',
    spine: '#c9a86a',
    ink: '#4a3b22',
    width: 18,
    height: 100,
    href: '/blog',
  },
  {
    id: 'about',
    title: 'About',
    spine: '#2e3d5c',
    ink: '#e8e4d8',
    width: 22,
    height: 92,
    href: '#about',
  },
];

/** Staggered intro timing (skipped under prefers-reduced-motion). */
export const INTRO = {
  initialDelayMs: 600,
  staggerMs: 380,
  peekHoldMs: 650,
} as const;

/**
 * The compact-layout breakpoint, shared by CSS and JS. "Mobile" means small
 * in either dimension: narrow phones AND short landscape phones get the
 * single-page photobook layout. The CSS mirror lives in
 * photobook.module.css (`@media (max-width: 700px), (max-height: 520px)`).
 */
export const COMPACT_QUERY = '(max-width: 700px), (max-height: 520px)';
