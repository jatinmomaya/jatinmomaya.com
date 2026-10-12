export interface PhotobookPhoto {
  src: string;
  caption: string;
  alt: string;
}

export const PHOTOBOOK_TITLE = 'Mexico City';
export const PHOTOBOOK_DATES = 'September 2026';

/**
 * The 19 curated photos, in Jatin's order: Tolantongo's waterfalls and
 * pools, Mexico City, then the Teotihuacán balloon flight.
 */
export const MEXICO_PHOTOS: PhotobookPhoto[] = [
  { src: '/photos/mexico/01.jpg', caption: 'Cascada La Gloria, Hidalgo', alt: 'Waterfall cascading down a mossy cliff, framed by jungle foliage' },
  { src: '/photos/mexico/02.jpg', caption: 'La Gloria', alt: 'Orange flower in sharp focus with a blurred waterfall behind it' },
  { src: '/photos/mexico/03.jpg', caption: 'Tolantongo', alt: 'Wide waterfall spilling over dark moss-covered rock' },
  { src: '/photos/mexico/04.jpg', caption: 'Tolantongo', alt: 'Close view of water streaming over bright green mossy rock' },
  { src: '/photos/mexico/05.jpg', caption: 'Grutas de Tolantongo', alt: 'Green mountain valley with a river winding below' },
  { src: '/photos/mexico/06.jpg', caption: 'Pozas de Tolantongo', alt: 'Turquoise thermal pools terraced into a mountainside with swimmers' },
  { src: '/photos/mexico/07.jpg', caption: 'Monumento a la Revolución, Mexico City', alt: 'The domed Monumento a la Revolución against a blue sky' },
  { src: '/photos/mexico/08.jpg', caption: 'Biblioteca Vasconcelos, Mexico City', alt: 'Looking down the suspended bookshelf stacks of the Vasconcelos library' },
  { src: '/photos/mexico/09.jpg', caption: 'Zócalo, Mexico City', alt: 'The Mexican flag flying before the Metropolitan Cathedral' },
  { src: '/photos/mexico/10.jpg', caption: 'Teotihuacán', alt: 'A hot air balloon envelope inflating with a burst of burner flame' },
  { src: '/photos/mexico/11.jpg', caption: 'Teotihuacán', alt: 'Ground crew holding a balloon envelope as the burner fires' },
  { src: '/photos/mexico/12.jpg', caption: 'Teotihuacán', alt: 'Dozens of colorful balloons aloft under a cloudy dawn sky' },
  { src: '/photos/mexico/13.jpg', caption: 'Teotihuacán', alt: 'A single checkered balloon floating against soft clouds' },
  { src: '/photos/mexico/14.jpg', caption: 'Teotihuacán', alt: 'Balloons drifting over the waking town at sunrise' },
  { src: '/photos/mexico/15.jpg', caption: 'Pyramid of the Sun, Teotihuacán', alt: 'A balloon floating beside the Pyramid of the Sun' },
  { src: '/photos/mexico/16.jpg', caption: 'Pyramid of the Moon, Teotihuacán', alt: 'Aerial view of a balloon beside the Pyramid of the Moon' },
  { src: '/photos/mexico/17.jpg', caption: 'Avenue of the Dead, Teotihuacán', alt: 'The ancient avenue stretching between pyramids, seen from above' },
  { src: '/photos/mexico/18.jpg', caption: 'Pyramid of the Moon, Teotihuacán', alt: 'Crowds climbing the steps of the Pyramid of the Moon' },
  { src: '/photos/mexico/19.jpg', caption: 'Teotihuacán', alt: 'Weathered stone detail of the pyramid masonry' },
];
