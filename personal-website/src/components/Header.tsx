import Link from 'next/link';
import styles from '../app/plain.module.css';

/** Chrome for the plain pages (the resume). The homepage and trips have their own. */
export default function Header() {
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.name}>
        Jatin Momaya
      </Link>
      <Link href="/" className={styles.back}>
        Back to the shelf
      </Link>
    </header>
  );
}
