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

let flicker: ReturnType<typeof createTimeline> | null = null;
let flickerRestoreTimer: number | null = null;

/**
 * Lamp switching on: the glow stutters to life like a real bulb, then
 * settles. Suspends the CSS opacity transition while the flicker runs so
 * the stutter isn't smoothed out. Call stopLampFlicker when switching off
 * mid-flicker.
 */
export function playLampFlicker(glowEl: HTMLElement) {
  stopLampFlicker(glowEl);
  if (prefersReducedMotion()) return;
  glowEl.style.transition = 'none';
  flicker = createTimeline()
    .add(glowEl, { opacity: [0, 1], duration: 80, ease: 'linear' })
    .add(glowEl, { opacity: 0.15, duration: 60, ease: 'linear' })
    .add(glowEl, { opacity: [0.15, 0.9], duration: 70, ease: 'linear' })
    .add(glowEl, { opacity: 0.4, duration: 90, ease: 'linear' })
    .add(glowEl, { opacity: [0.4, 1], duration: 300, ease: 'outQuad' });
  // Total ~600ms; then hand opacity back to CSS.
  flickerRestoreTimer = window.setTimeout(() => {
    glowEl.style.transition = '';
    flickerRestoreTimer = null;
  }, 650);
}

export function stopLampFlicker(glowEl: HTMLElement) {
  if (flicker) {
    const f = flicker as unknown as { revert?: () => void; cancel?: () => void };
    if (typeof f.revert === 'function') f.revert();
    else if (typeof f.cancel === 'function') f.cancel();
    flicker = null;
  }
  if (flickerRestoreTimer !== null) {
    window.clearTimeout(flickerRestoreTimer);
    flickerRestoreTimer = null;
  }
  glowEl.style.transition = '';
  glowEl.style.opacity = '';
}
