import type { PhotobookChapter, PhotobookPhoto } from './types';

export type { PhotobookPhoto };

export const PHOTOBOOK_TITLE = 'Mexico';
export const PHOTOBOOK_DATES = 'September 2026';
/**
 * The 19 curated photos, in Jatin's order: Tolantongo's waterfalls and
 * pools, Mexico City, then the Teotihuacán balloon flight.
 *
 * Asset pipeline (static export = we own it): every photo added here must be
 * re-encoded first — 1170px wide, JPEG quality 68, progressive:
 *   python3 -c "from PIL import Image; im = Image.open('in.jpg').convert('RGB'); im.save('out.jpg', 'JPEG', quality=68, optimize=True, progressive=True)"
 * Then record its dimensions below.
 */
export const MEXICO_PHOTOS: PhotobookPhoto[] = [
  { src: '/photos/mexico/01.jpg', caption: 'Grutas de Tolantongo, Hidalgo', alt: 'Waterfall cascading down a mossy cliff, framed by jungle foliage', width: 1170, height: 780 },
  { src: '/photos/mexico/02.jpg', caption: 'Grutas de Tolantongo', alt: 'Orange flower in sharp focus with a blurred waterfall behind it', width: 1170, height: 1463 },
  { src: '/photos/mexico/03.jpg', caption: 'Grutas de Tolantongo', alt: 'Wide waterfall spilling over dark moss-covered rock', width: 1170, height: 623 },
  { src: '/photos/mexico/04.jpg', caption: 'Tolantongo', alt: 'Close view of water streaming over bright green mossy rock', width: 1170, height: 786 },
  { src: '/photos/mexico/05.jpg', caption: 'Grutas de Tolantongo', alt: 'Green mountain valley with a river winding below', width: 1170, height: 780 },
  { src: '/photos/mexico/06.jpg', caption: 'Pozas de Tolantongo', alt: 'Turquoise thermal pools terraced into a mountainside with swimmers', width: 1170, height: 1463 },
  { src: '/photos/mexico/07.jpg', caption: 'Monumento a la Revolución, Mexico City', alt: 'The domed Monumento a la Revolución against a blue sky', width: 1170, height: 1417 },
  { src: '/photos/mexico/08.jpg', caption: 'Biblioteca Vasconcelos, Mexico City', alt: 'Looking down the suspended bookshelf stacks of the Vasconcelos library', width: 1170, height: 1463 },
  { src: '/photos/mexico/09.jpg', caption: 'Zócalo, Mexico City', alt: 'The Mexican flag flying before the Metropolitan Cathedral', width: 1170, height: 1776 },
  { src: '/photos/mexico/10.jpg', caption: 'Teotihuacán', alt: 'A hot air balloon envelope inflating with a burst of burner flame', width: 1170, height: 1812 },
  { src: '/photos/mexico/11.jpg', caption: 'Teotihuacán', alt: 'Ground crew holding a balloon envelope as the burner fires', width: 1170, height: 837 },
  { src: '/photos/mexico/12.jpg', caption: 'Teotihuacán', alt: 'Dozens of colorful balloons aloft under a cloudy dawn sky', width: 1170, height: 780 },
  { src: '/photos/mexico/13.jpg', caption: 'Teotihuacán', alt: 'A single checkered balloon floating against soft clouds', width: 1170, height: 1170 },
  { src: '/photos/mexico/14.jpg', caption: 'Teotihuacán', alt: 'Balloons drifting over the waking town at sunrise', width: 1170, height: 780 },
  { src: '/photos/mexico/15.jpg', caption: 'Pyramid of the Sun, Teotihuacán', alt: 'A balloon floating beside the Pyramid of the Sun', width: 1170, height: 780 },
  { src: '/photos/mexico/16.jpg', caption: 'Pyramid of the Moon, Teotihuacán', alt: 'Aerial view of a balloon beside the Pyramid of the Moon', width: 1170, height: 785 },
  { src: '/photos/mexico/17.jpg', caption: 'Avenue of the Dead, Teotihuacán', alt: 'The ancient avenue stretching between pyramids, seen from above', width: 1170, height: 714 },
  { src: '/photos/mexico/18.jpg', caption: 'Pyramid of the Moon, Teotihuacán', alt: 'Crowds climbing the steps of the Pyramid of the Moon', width: 1170, height: 558 },
  { src: '/photos/mexico/19.jpg', caption: 'Teotihuacán', alt: 'Weathered stone detail of the pyramid masonry', width: 1170, height: 634 },
];

/** Warm the given photo indexes into the browser cache. */
export function warmPhotos(indexes: number[]) {
  if (typeof window === 'undefined') return;
  indexes.forEach((i) => {
    if (i < 0 || i >= MEXICO_PHOTOS.length) return;
    const img = new Image();
    img.src = MEXICO_PHOTOS[i].src;
  });
}

export const MEXICO_CHAPTER: PhotobookChapter = {
  id: 'mexico',
  title: PHOTOBOOK_TITLE,
  subtitle: PHOTOBOOK_DATES,
  photos: MEXICO_PHOTOS,
};
