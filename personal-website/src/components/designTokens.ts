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
    title: 'Mexico Photobook',
    spine: '#2e4a38',
    ink: '#f3ead6',
    // Photobooks are bigger than reading books — this one stands taller
    // on the shelf, with room on the spine for the full title.
    width: 24,
    height: 118,
    href: '/photography',
  },
  {
    id: 'field-notes',
    title: 'Field notes',
    spine: '#6f3128',
    ink: '#f3ead6',
    width: 18,
    height: 100,
    href: '/blog',
  },
  {
    id: 'about',
    title: 'About',
    spine: '#26334f',
    ink: '#e8e4d8',
    width: 22,
    height: 92,
    href: '#about',
  },
];

export interface PlaceholderBook {
  id: string;
  title: string;
  spine: string;
  width: number;
  height: number;
}

// These use the same spine renderer as navigation books, so a future
// placeholder can move into NAV_BOOKS without rebuilding its visual treatment.
export const PLACEHOLDER_BOOKS: PlaceholderBook[] = [
  { id: 'placeholder-essays', title: 'Collected essays', spine: '#455044', width: 21, height: 74 },
  { id: 'placeholder-atlas', title: 'An atlas of night', spine: '#49313a', width: 17, height: 94 },
  { id: 'placeholder-poems', title: 'Selected poems', spine: '#343d50', width: 23, height: 82 },
  { id: 'placeholder-gardens', title: 'Winter gardens', spine: '#554a32', width: 18, height: 67 },
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
