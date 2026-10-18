/**
 * The pinboard layout sheet. Everything is placed in artboard units on a
 * 1600 x 900 board; the stage scales one unit to (viewport width / 1600),
 * so the composition keeps its proportions at every screen size.
 *
 * Phones get a flowing layout instead (see studio.module.css); only the
 * order of the items and each item's `span` matter there.
 */
import { MEXICO_PHOTOS } from '../components/photobook/mexico';
import type { PhotobookPhoto } from '../components/photobook/types';

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
  about: { x: 1262, y: 70, w: 242, h: 132, r: 3 },
  linkedin: { x: 1266, y: 236, w: 238, h: 76, r: -2 },
  github: { x: 1266, y: 332, w: 238, h: 76, r: 2 },
  resume: { x: 1318, y: 440, w: 184, h: 214, r: -2 },
  writing: { x: 930, y: 62, w: 300, h: 580, r: 1.5 },
} satisfies Record<string, Slot>;

/**
 * Where photo prints go, in display order, and which photo (by index into
 * the Mexico chapter) hangs in each. A portrait slot takes a portrait photo.
 * Three prints is the set when there is a Writing page; two more fill its
 * place when there isn't one.
 */
export interface PrintSlot extends Slot {
  photo: number;
}

const PRINTS_BASE: PrintSlot[] = [
  { x: 112, y: 196, w: 270, h: 340, r: -4, photo: 5 },
  { x: 560, y: 70, w: 340, h: 258, r: 3, photo: 11 },
  { x: 410, y: 352, w: 350, h: 262, r: 4, photo: 0 },
];
export const PRINTS_WITH_WRITING: PrintSlot[] = PRINTS_BASE;
export const PRINTS_WITHOUT_WRITING: PrintSlot[] = [
  ...PRINTS_BASE,
  { x: 934, y: 70, w: 300, h: 204, r: 2, photo: 4 },
  { x: 976, y: 318, w: 220, h: 282, r: -2.5, photo: 7 },
];

/** Pinboard prints use the small versions: public/photos/<chapter>/t/NN.jpg */
export function thumbSrc(photo: PhotobookPhoto): string {
  return photo.src.replace(/\/(\d+)\.jpg$/, '/t/$1.jpg');
}

export interface Print {
  slot: Slot;
  src: string;
  caption: string;
  alt: string;
  /** index into the chapter, so a tap can open the book at this photo */
  index: number;
  width: number;
  height: number;
}

export function buildPrints(hasWriting: boolean): Print[] {
  return (hasWriting ? PRINTS_WITH_WRITING : PRINTS_WITHOUT_WRITING).map((slot) => {
    const p = MEXICO_PHOTOS[slot.photo];
    return {
      slot,
      src: thumbSrc(p),
      caption: p.caption,
      alt: p.alt,
      index: slot.photo,
      width: p.width,
      height: p.height,
    };
  });
}
