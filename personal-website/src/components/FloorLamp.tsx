import { useEffect, useRef } from 'react';
import { springCord } from './anim';
import styles from '../app/room.module.css';

interface FloorLampProps {
  on: boolean;
  onToggle: () => void;
}

/**
 * Tall floor lamp with a fabric drum shade, plus its warm pool of light.
 * The lamp is a switch: clicking or tapping it turns the light on and off.
 * Toggling the lamp gives its pull cord a small springing dip.
 */
export default function FloorLamp({ on, onToggle }: FloorLampProps) {
  const cordRef = useRef<SVGGElement>(null);
  const mounted = useRef(false);

  // Flicker on user toggle (not on first mount).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (cordRef.current) springCord(cordRef.current);
  }, [on]);

  return (
    <>
      <div className={on ? styles.lampGlow : `${styles.lampGlow} ${styles.lampGlowOff}`} aria-hidden="true" />
      <button
        type="button"
        className={styles.lamp}
        aria-pressed={on}
        aria-label={on ? 'Turn the lamp off' : 'Turn the lamp on'}
        onClick={onToggle}
      >
        <svg viewBox="0 0 132 500">
          <defs>
            <radialGradient id="shadeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd9a0" stopOpacity={on ? 0.85 : 0} />
              <stop offset="100%" stopColor="#ffd9a0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="66" cy="70" rx="100" ry="70" fill="url(#shadeGlow)" />
          <path d="M28 24 L104 24 L98 94 L34 94 Z" fill={on ? '#e2cda1' : '#b3a68c'} />
          <path d="M28 24 L104 24 L102 36 L30 36 Z" fill={on ? '#8a6f4d' : '#6e5f4b'} />
          <ellipse cx="66" cy="94" rx="32" ry="6" fill={on ? '#c9ae7e' : '#9c8c72'} />
          <circle cx="66" cy="100" r="8" fill={on ? '#ffe2b0' : '#6b6257'} />
          <g ref={cordRef}>
            <line x1="88" y1="92" x2="88" y2="126" stroke="#2b2b2b" strokeWidth="2" />
            <circle cx="88" cy="131" r="4" fill="#8a6f4d" />
          </g>
          <rect x="61" y="94" width="10" height="342" fill="#2b2b2b" />
          <ellipse cx="66" cy="466" rx="36" ry="11" fill="#1f1f1f" />
          <rect x="61" y="436" width="10" height="18" fill="#2b2b2b" />
        </svg>
      </button>
    </>
  );
}
