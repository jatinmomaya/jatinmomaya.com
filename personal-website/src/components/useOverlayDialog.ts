import { useCallback, useEffect, useRef, useState } from 'react';
import { playCloseAnimation, playOpenAnimation, prefersReducedMotion } from './anim';

/**
 * Shared behavior for a page that grows out of a shelf book: open and
 * close animation from the book's position, body scroll lock, Escape to
 * close, and a Tab trap. Focus returns to the opener in the caller.
 */
export function useOverlayDialog(
  origin: { x: number; y: number } | null,
  onClose: () => void,
  /** set `active: false` while another layer (a full-screen viewer) is on top, so Escape and Tab go to it */
  options: { active?: boolean } = {},
) {
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(true);
  activeRef.current = options.active ?? true;

  const requestClose = useCallback(() => {
    const sheet = dialogRef.current;
    if (prefersReducedMotion() || !sheet) {
      onClose();
      return;
    }
    setClosing(true);
    // Closing never waits on the animation alone: if it stalls (a background
    // window pauses animations), the timer still closes the dialog.
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onClose();
    };
    playCloseAnimation(sheet).then(finish);
    window.setTimeout(finish, 450);
  }, [onClose]);

  useEffect(() => {
    if (dialogRef.current) playOpenAnimation(dialogRef.current, origin);
    // origin is fixed for the overlay's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (!activeRef.current) return;
      if (e.key === 'Escape') {
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const scope = dialogRef.current;
      if (!scope) return;
      const focusables = Array.from(
        scope.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'),
      ).filter((el) => el.getClientRects().length > 0);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [requestClose]);

  return { closing, dialogRef, requestClose };
}
