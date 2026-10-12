import styles from '../app/room.module.css';

/** Tall floor lamp with a fabric drum shade, plus its warm pool of light. */
export default function FloorLamp() {
  return (
    <>
      <div className={styles.lampGlow} aria-hidden="true" />
      <div className={styles.lamp} aria-hidden="true">
        <svg viewBox="0 0 132 430">
          <defs>
            <radialGradient id="shadeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffd9a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="66" cy="70" rx="100" ry="70" fill="url(#shadeGlow)" />
          <path d="M28 24 L104 24 L98 94 L34 94 Z" fill="#e2cda1" />
          <path d="M28 24 L104 24 L102 36 L30 36 Z" fill="#8a6f4d" />
          <ellipse cx="66" cy="94" rx="32" ry="6" fill="#c9ae7e" />
          <circle cx="66" cy="100" r="8" fill="#ffe2b0" />
          <line x1="88" y1="92" x2="88" y2="126" stroke="#4a4a4a" strokeWidth="2" />
          <circle cx="88" cy="131" r="4" fill="#8a6f4d" />
          <rect x="61" y="94" width="10" height="282" fill="#4a4a4a" />
          <ellipse cx="66" cy="398" rx="36" ry="11" fill="#3a3a3a" />
          <rect x="61" y="372" width="10" height="18" fill="#4a4a4a" />
        </svg>
      </div>
    </>
  );
}
