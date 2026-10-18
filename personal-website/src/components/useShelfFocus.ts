import { useCallback, useRef, useState, type PointerEvent, type RefObject, type TouchEvent } from 'react';

/**
 * Bloom geometry, in pixels: the focused book opens all the way and the books
 * on either side part clear of it. Shelves scale with the room, so callers
 * pass these multiplied by the current unit.
 */
export interface ShelfFocusOptions {
  /** how far from a book's center the pointer still selects it */
  rangePx: number;
  /** how far neighbors slide aside */
  shiftPx: number;
  /** hysteresis: don't hand focus off on a tie */
  stickPx: number;
}
const DEFAULT_OPTIONS: ShelfFocusOptions = { rangePx: 72, shiftPx: 44, stickPx: 10 };

/**
 * Discrete shelf focus, shared by every shelf. The pointer (or a finger)
 * selects ONE book, which blooms fully and stays bloomed while the pointer
 * is in its zone. Centers are measured on the untransformed <li> wrappers,
 * so the focus never chases the bloom.
 *
 * Books are found by `[data-book="<id>"]` inside `containerRef`, so two
 * shelves on one page don't see each other.
 */
export function useShelfFocus(
  ids: string[],
  containerRef: RefObject<HTMLElement | null>,
  /** a book held open by a tap or keyboard focus; pointer focus wins over it */
  heldId: string | null = null,
  options: ShelfFocusOptions = DEFAULT_OPTIONS,
) {
  const optsRef = useRef(options);
  optsRef.current = options;
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusIdRef = useRef<string | null>(null);

  const centerX = useCallback(
    (id: string): number | null => {
      const li = containerRef.current?.querySelector(`[data-book="${id}"]`)?.closest('li');
      if (!li) return null;
      const rect = li.getBoundingClientRect();
      return rect.left + rect.width / 2;
    },
    [containerRef],
  );

  const idsRef = useRef(ids);
  idsRef.current = ids;

  const update = useCallback(
    (clientX: number | null) => {
      if (clientX === null) {
        if (focusIdRef.current !== null) {
          focusIdRef.current = null;
          setFocusId(null);
        }
        return;
      }
      let best: { id: string; dist: number } | null = null;
      for (const id of idsRef.current) {
        const cx = centerX(id);
        if (cx === null) continue;
        const dist = Math.abs(clientX - cx);
        if (!best || dist < best.dist) best = { id, dist };
      }
      let next: string | null = null;
      if (best && best.dist <= optsRef.current.rangePx) {
        next = best.id;
        const prev = focusIdRef.current;
        if (prev && prev !== next) {
          const pcx = centerX(prev);
          if (pcx !== null && best.dist > Math.abs(clientX - pcx) - optsRef.current.stickPx) next = prev;
        }
      }
      if (next !== focusIdRef.current) {
        focusIdRef.current = next;
        setFocusId(next);
      }
    },
    [centerX],
  );

  const activeId = focusId ?? heldId;
  const activeIndex = activeId ? ids.indexOf(activeId) : -1;

  return {
    activeId,
    bloomFor: (id: string) => (activeId !== null && id === activeId ? 1 : 0),
    shiftFor: (id: string) => {
      if (activeId === null || activeId === id || activeIndex < 0) return 0;
      return (ids.indexOf(id) < activeIndex ? -1 : 1) * options.shiftPx;
    },
    // A swipe across the shelf drives the same focus as the mouse, so it
    // ripples across the books.
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'touch') update(e.clientX);
    },
    onPointerLeave: () => update(null),
    onTouchMove: (e: TouchEvent<HTMLElement>) => {
      const t = e.touches[0];
      if (t) update(t.clientX);
    },
    onTouchEnd: () => update(null),
  };
}
