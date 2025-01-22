import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link href="/">Jatin Momaya</Link>
        </div>
        <ul className="flex space-x-6">
          <li>
            <Link href="/" className="hover:text-gray-300">
              About Me
            </Link>
          </li>
          <li>
            <Link href="/products" className="hover:text-gray-300">
              Products
            </Link>
          </li>
          <li>
            <Link href="/blog" className="hover:text-gray-300">
              Blog
            </Link>
          </li>
          <li>
            <Link href="/resume" className="hover:text-gray-300">
              Resume
            </Link>
          </li>
          <li>
            <Link href="/bookshelf" className="hover:text-gray-300">
              Bookshelf
            </Link>
          </li>
          <li>
            <Link href="/photography" className="hover:text-gray-300">
              Photography
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
