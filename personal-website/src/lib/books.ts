/**
 * Books data model. The source of truth is src/data/books.json: one entry
 * per book, edited by hand (or, later, by a sync that only writes the
 * fields marked "synced" and never touches the rest).
 *
 * A book's spine (color, width, height) is derived from its id, so adding
 * a book never needs an image and the shelf weighs the same at 8 books or 80.
 */

export interface Book {
  /** stable slug, also the cover filename: public/books/covers/<id>.webp */
  id: string;
  title: string;
  author: string;
  /** synced */
  status: 'reading' | 'read';
  /** synced when a date is known: YYYY-MM-DD, YYYY-MM or YYYY */
  finished?: string;
  /** synced, 1 to 5 */
  rating?: number;
  /** hand-written, one line */
  note?: string;
  favorite?: boolean;
  /** true when a real cover file exists at public/books/covers/<id>.webp */
  cover?: boolean;
  /** spine color; set from the cover by scripts/covers.mjs, else derived from the id */
  spine?: string;
  /** spine title color, paired with `spine` */
  ink?: string;
  /** page count, from Goodreads; spine thickness follows it */
  pages?: number;
  /** Goodreads book id, so a sync can tell which entries it already has */
  goodreadsId?: string;
}

/** Sizes are artboard units (see data/board.ts), not pixels. */
export interface ShelfBook extends Book {
  color: string;
  ink: string;
  width: number;
  height: number;
}

const SPINE_PALETTE = [
  '#2e4a38', '#6f3128', '#26334f', '#455044', '#49313a',
  '#343d50', '#554a32', '#3b4a52', '#5a3a24', '#4a3a55',
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function toShelfBook(book: Book): ShelfBook {
  const h = hash(book.id);
  // Thickness follows the page count: a thin book of poems looks thin, a
  // thick fantasy novel looks thick. Without a count it falls back to the hash.
  const width = book.pages
    ? Math.min(44, Math.max(19, Math.round(15 + book.pages / 22)))
    : 22 + (h >>> 4) % 12;
  return {
    ...book,
    color: book.spine ?? SPINE_PALETTE[h % SPINE_PALETTE.length],
    ink: book.ink ?? '#efe3c9',
    width,
    height: 118 + (h >>> 9) % 34,
  };
}

/** Reading now first, then finished books newest first. Undated books keep file order, last. */
export function sortBooks(books: Book[]): Book[] {
  const rank = (b: Book) => (b.status === 'reading' ? 0 : 1);
  return books
    .map((book, index) => ({ book, index }))
    .sort((a, b) => {
      if (rank(a.book) !== rank(b.book)) return rank(a.book) - rank(b.book);
      const da = a.book.finished ?? '';
      const db = b.book.finished ?? '';
      if (da !== db) return da < db ? 1 : -1;
      return a.index - b.index;
    })
    .map((x) => x.book);
}

/**
 * The most books the shelf ever shows, however wide the screen. A shelf of a
 * dozen reads as a shelf; more reads as a wall. The row trims further to fit
 * narrow screens, and the full list lives behind the "All books" stack.
 */
export const SHELF_MAX = 12;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatFinished(finished?: string): string {
  if (!finished) return '';
  const [y, m] = finished.split('-');
  return m ? `${MONTHS[Number(m) - 1] ?? ''} ${y}`.trim() : y;
}

export function finishedYear(finished?: string): string {
  return finished ? finished.slice(0, 4) : '';
}
