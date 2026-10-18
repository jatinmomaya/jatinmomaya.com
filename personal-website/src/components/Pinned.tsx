import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { Slot } from '../data/board';
import styles from '../app/board.module.css';

export type PinColor = 'red' | 'brass' | 'blue' | 'green';

const PIN_CLASS: Record<PinColor, string> = {
  red: '',
  brass: styles.pinBrass,
  blue: styles.pinBlue,
  green: styles.pinGreen,
};

export interface PinnedProps {
  /** where it hangs on the artboard, in units */
  slot: Slot;
  /** the element to render: a plain card, a button, or a link */
  as?: 'div' | 'button' | 'a';
  /** a push pin at the top edge; null for none */
  pin?: PinColor | null;
  /** where along the top edge the pin goes (CSS length), default centered */
  pinX?: string;
  /** masking-tape label; offsets are units from the item's top-left */
  label?: { text: string; dx: number; dy: number; rot?: number };
  /** columns it takes in the phone grid */
  span?: 1 | 2;
  className?: string;
  /** accent color for the item (link cards use it for their edge) */
  accent?: string;
  children: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  'aria-label'?: string;
}

/**
 * One thing pinned to the board. Placement comes from the layout sheet
 * (src/data/board.ts); the CSS decides whether it is used (wide screens)
 * or ignored in favor of the phone grid.
 */
export default function Pinned({
  slot,
  as = 'div',
  pin = 'red',
  pinX,
  label,
  span,
  className,
  accent,
  children,
  ...rest
}: PinnedProps) {
  const interactive = as !== 'div';
  const style = {
    '--x': slot.x,
    '--y': slot.y,
    '--w': slot.w,
    '--h': slot.h,
    '--r': `${slot.r}deg`,
    ...(span ? { '--span': span } : {}),
    ...(pinX ? { '--pinx': pinX } : {}),
    ...(accent ? { '--accent': accent } : {}),
  } as CSSProperties;
  const cls = [styles.item, interactive ? styles.interactive : '', className ?? ''].filter(Boolean).join(' ');
  const inner = (
    <>
      {pin && <span className={`${styles.pin} ${PIN_CLASS[pin]}`} aria-hidden="true" />}
      {children}
      {label && (
        <span
          className={styles.label}
          aria-hidden="true"
          style={{ '--lx': label.dx, '--ly': label.dy, '--lr': `${label.rot ?? 0}deg` } as CSSProperties}
        >
          {label.text}
        </span>
      )}
    </>
  );

  if (as === 'a') {
    return (
      <a className={cls} style={style} {...rest}>
        {inner}
      </a>
    );
  }
  if (as === 'button') {
    return (
      <button type="button" className={cls} style={style} {...rest}>
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} style={style} {...rest}>
      {inner}
    </div>
  );
}
