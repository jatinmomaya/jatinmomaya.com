import BookshelfHome, { type FavoriteItem } from '../components/BookshelfHome';
import type { Post } from '../components/BoardItems';
import booksData from '../data/books.json';
import favoritesData from '../data/favorites.json';
import writingData from '../data/writing.json';
import { getTripSummaries } from '../lib/trips.server';
import type { Book } from '../lib/books';

export const metadata = {
  title: 'Jatin Momaya',
  description: 'The personal site of Jatin Momaya.',
  openGraph: {
    title: 'Jatin Momaya',
    description: 'The personal site of Jatin Momaya: what I am reading, my favorite books, and photographs from my trips.',
    type: 'website' as const,
  },
};

export default function Home() {
  // A shelf of intent, not a full library: what I'm reading now, and the
  // books on my Goodreads "favorites" shelf. The rest of the library stays
  // in books.json for later.
  const reading = (booksData.books as Book[]).filter((b) => b.status === 'reading');
  return (
    <BookshelfHome
      reading={reading}
      favorites={favoritesData.items as FavoriteItem[]}
      trips={getTripSummaries()}
      posts={writingData.posts as Post[]}
    />
  );
}
