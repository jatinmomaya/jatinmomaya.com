/**
 * Central animation helpers, built on anime.js.
 *
 * Every JS-driven animation goes through here so the reduced-motion
 * contract lives in one place: if the user prefers reduced motion,
 * timelines never play and elements jump to their end state.
 */
import { animate, createTimeline } from 'animejs';

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function viewportOrigin(origin: { x: number; y: number } | null) {
  return {
    x: origin?.x ?? window.innerWidth / 2,
    y: origin?.y ?? window.innerHeight / 2,
  };
}

/**
 * Book opening: the overlay grows out of the book's shelf position with
 * a 3D tilt, like the book turning to face the reader.
 * The element must cover the viewport (position: fixed; inset: 0) for the
 * px transform-origin to land on the book.
 */
export function playOpenAnimation(el: HTMLElement, origin: { x: number; y: number } | null) {
  if (prefersReducedMotion()) return;
  const { x, y } = viewportOrigin(origin);
  el.style.transformOrigin = `${x}px ${y}px`;
  createTimeline()
    .add(el, {
      scale: [0.15, 1],
      rotateY: [-22, 0],
      opacity: [0, 1],
      duration: 600,
      ease: 'outExpo',
    });
}

/** Page turn: the new spread tilts in like a turning page. */
export function playPageTurn(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  animate(el, {
    rotateY: [-14, 0],
    opacity: [0.25, 1],
    duration: 380,
    ease: 'outCubic',
  });
}
/** Book closing: shrink back toward the book. Resolves when done. */
export function playCloseAnimation(el: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    if (prefersReducedMotion()) {
      resolve();
      return;
    }
    animate(el, {
      scale: 0.12,
      opacity: 0,
      duration: 260,
      ease: 'inQuad',
      onComplete: () => resolve(),
    });
  });
}
