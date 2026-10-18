import BookshelfHome, { type FavoriteItem, type Post } from '../components/BookshelfHome';
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

function withoutSyncId<T extends object>(item: T): T {
  return Object.fromEntries(Object.entries(item).filter(([k]) => k !== 'goodreadsId')) as T;
}

export default function Home() {
  // A shelf of intent, not a full library: what I'm reading now, and the
  // books on my Goodreads "favorites" shelf. The rest of the library stays
  // in books.json for later.
  // Sync ids stay in the data files; the page only gets what it shows.
  const reading = (booksData.books as Book[])
    .filter((b) => b.status === 'reading')
    .map((b) => withoutSyncId(b));
  const favorites = (favoritesData.items as FavoriteItem[]).map((f) => ({
    ...withoutSyncId(f),
    books: f.books.map((x) => ({ title: x.title, order: x.order })),
  }));
  return (
    <BookshelfHome
      reading={reading}
      favorites={favorites}
      trips={getTripSummaries()}
      posts={writingData.posts as Post[]}
    />
  );
}
