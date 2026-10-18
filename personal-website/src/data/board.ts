/**
 * The pinboard layout sheet. Everything is placed in artboard units on a
 * 1600 x 900 board; the stage scales one unit to (viewport width / 1600),
 * so the composition keeps its proportions at every screen size.
 *
 * Phones get a flowing layout instead (see studio.module.css); only the
 * order of the items and each item's `span` matter there.
 */

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
  /** rotation in degrees */
  r: number;
}

/** Frame and cork surface, in artboard units. */
export const BOARD_FRAME = { x: 50, y: 26, w: 1500, h: 642, pad: 20 } as const;

/** The shelf under the board. */
export const SHELF = { x: 104, w: 1392, surfaceY: 836, rowH: 152 } as const;

export const SLOTS = {
  masthead: { x: 112, y: 64, w: 420, h: 84, r: -1 },
  allTrips: { x: 570, y: 70, w: 210, h: 76, r: 2 },
  about: { x: 1262, y: 70, w: 242, h: 132, r: 3 },
  linkedin: { x: 1266, y: 236, w: 238, h: 76, r: -2 },
  github: { x: 1266, y: 332, w: 238, h: 76, r: 2 },
  resume: { x: 1318, y: 440, w: 184, h: 214, r: -2 },
  writing: { x: 930, y: 62, w: 300, h: 580, r: 1.5 },
} satisfies Record<string, Slot>;

/** The most trips the board shows as stacks; every trip is on the /trips page. */
export const HOME_TRIPS = 4;

/**
 * Where trip stacks go. The left of the board holds up to four stacks, spread
 * across the room it has: one trip gets one big stack, four get four small
 * ones. A new trip takes the next position on its own; nothing is placed by hand.
 */
export function stackSlots(n: number): Slot[] {
  const count = Math.max(1, Math.min(HOME_TRIPS, n));
  const layouts: Slot[][] = [
    [{ x: 300, y: 205, w: 300, h: 380, r: -2 }],
    [
      { x: 215, y: 225, w: 240, h: 305, r: -3 },
      { x: 545, y: 215, w: 240, h: 305, r: 2.5 },
    ],
    [
      { x: 135, y: 235, w: 190, h: 242, r: -3 },
      { x: 405, y: 222, w: 190, h: 242, r: 2 },
      { x: 675, y: 240, w: 190, h: 242, r: -2 },
    ],
    [
      { x: 114, y: 245, w: 148, h: 196, r: -3 },
      { x: 322, y: 232, w: 148, h: 196, r: 2 },
      { x: 530, y: 250, w: 148, h: 196, r: -2 },
      { x: 738, y: 236, w: 148, h: 196, r: 3 },
    ],
  ];
  return layouts[count - 1];
}
