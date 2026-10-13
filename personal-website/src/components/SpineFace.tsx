import type { CSSProperties } from 'react';
import styles from '../app/room.module.css';

interface SpineFaceProps {
  title: string;
  color: string;
  ink?: string;
}

/** Shared face treatment for interactive navigation books and display books. */
export default function SpineFace({ title, color, ink = '#f3ead6' }: SpineFaceProps) {
  return (
    <span className={styles.spine} style={{ '--c': color, '--ink': ink } as CSSProperties}>
      <span className={styles.spineTitle}>{title}</span>
    </span>
  );
}
