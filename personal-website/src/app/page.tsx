import Studio from '../components/Studio';
import type { Post } from '../components/BoardItems';
import booksData from '../data/books.json';
import writingData from '../data/writing.json';
import { buildPrints } from '../data/board';
import { SHELF_MAX, sortBooks, toShelfBook, type Book } from '../lib/books';

export const metadata = {
  title: 'Jatin Momaya',
  description: 'The personal site of Jatin Momaya.',
};

export default function Home() {
  // Only the most recent books reach the client for the shelf; the full
  // list loads on demand with the "All books" page.
  const books = sortBooks(booksData.books as Book[]);
  const shelfBooks = books.slice(0, SHELF_MAX).map(toShelfBook);
  const posts = writingData.posts as Post[];
  return (
    <Studio
      shelfBooks={shelfBooks}
      totalBooks={books.length}
      prints={buildPrints(posts.length > 0)}
      posts={posts}
    />
  );
}
