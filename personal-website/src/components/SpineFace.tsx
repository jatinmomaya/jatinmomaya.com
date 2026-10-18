import styles from '../app/shelf.module.css';

interface SpineFaceProps {
  title: string;
}

/** The face of a book's spine: color comes from the book's --c variable. */
export default function SpineFace({ title }: SpineFaceProps) {
  return (
    <span className={styles.spine}>
      <span className={styles.spineTitle}>{title}</span>
    </span>
  );
}
