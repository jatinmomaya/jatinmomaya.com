import styles from '../app/room.module.css';

/** Small engraved brass plaque: the site's name, and its real h1. */
export default function BrassPlaque() {
  return (
    <header className={styles.plaqueHeader}>
      <h1 className={styles.plaque}>Jatin Momaya</h1>
    </header>
  );
}
