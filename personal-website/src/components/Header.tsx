import Link from 'next/link';

/** Chrome for the plain pages (the resume). The homepage and trips have their own. */
export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link href="/">Jatin Momaya</Link>
        </div>
        <Link href="/" className="hover:text-gray-300">
          Back to the shelf
        </Link>
      </nav>
    </header>
  );
}
