import { MEXICO_CHAPTER } from './mexico';
import type { PhotobookChapter, PhotobookPhoto } from './types';

export type { PhotobookChapter, PhotobookPhoto };

/**
 * Chapter registry. Adding a new trip's book is:
 *   1. Drop re-encoded photos in public/photos/<id>/ (see that README).
 *   2. Add a data file like mexico.ts exporting a PhotobookChapter.
 *   3. Register it in CHAPTERS below.
 *   4. Point a shelf book at it (Bookshelf's openChapter).
 *
 * Photos are referenced by URL string, never imported — so chapter data
 * stays kilobytes and no photo bytes ever enter the JS bundle. Images
 * only load when their chapter is opened, plus neighbor preloading.
 */
const CHAPTERS: Record<string, PhotobookChapter> = {
  mexico: MEXICO_CHAPTER,
};

export function getChapter(id: string): PhotobookChapter | undefined {
  return CHAPTERS[id];
}

/** Warm the given photo indexes of a chapter into the browser cache. */
export function warmChapterPhotos(chapter: PhotobookChapter, indexes: number[]) {
  if (typeof window === 'undefined') return;
  indexes.forEach((i) => {
    if (i < 0 || i >= chapter.photos.length) return;
    const img = new Image();
    img.src = chapter.photos[i].src;
  });
}
