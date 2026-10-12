import styles from '../app/room.module.css';

interface PictureFrameProps {
  variant: 'a' | 'b';
}

/** Muted watercolor mountain landscape (placeholder art). */
function MountainArt() {
  return (
    <svg viewBox="0 0 76 144" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mountain landscape print">
      <rect width="76" height="144" fill="#e8e0d0" />
      <rect width="76" height="60" fill="#dfe4e6" />
      <circle cx="56" cy="26" r="10" fill="#e9d9a8" opacity="0.9" />
      <path d="M0 96 L22 52 L40 84 L58 44 L76 78 L76 144 L0 144 Z" fill="#9aa5a8" opacity="0.75" />
      <path d="M0 110 L28 70 L48 100 L66 76 L76 92 L76 144 L0 144 Z" fill="#7c8891" opacity="0.85" />
      <path d="M0 126 L76 112 L76 144 L0 144 Z" fill="#5f6b74" opacity="0.9" />
    </svg>
  );
}

/** Bauhaus-style geometric print (placeholder art). */
function BauhausArt() {
  return (
    <svg viewBox="0 0 84 176" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Geometric print">
      <rect width="84" height="176" fill="#f2ede2" />
      <circle cx="42" cy="52" r="26" fill="#c46a4a" />
      <rect x="14" y="92" width="56" height="14" fill="#3a4a5a" />
      <path d="M14 120 L70 120 L42 158 Z" fill="#d9a441" />
      <line x1="14" y1="168" x2="70" y2="168" stroke="#3a4a5a" strokeWidth="3" />
    </svg>
  );
}

/** Thin black frame hung on the wall (decorative). */
export default function PictureFrame({ variant }: PictureFrameProps) {
  const className = variant === 'a' ? styles.frameA : styles.frameB;
  return (
    <div className={`${styles.frame} ${className}`} aria-hidden="true">
      {variant === 'a' ? <MountainArt /> : <BauhausArt />}
    </div>
  );
}
