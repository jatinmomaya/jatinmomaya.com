// Add or update a trip's photos. Run from the personal-website directory:
//
//   node scripts/photos.mjs <trip-id>          originals in photos-src/<trip-id>/
//   node scripts/photos.mjs <trip-id> --web    sources are already in public/photos/<trip-id>/NN.jpg
//   node scripts/photos.mjs <trip-id> --force  redo photos that are already encoded
//   node scripts/photos.mjs <trip-id> --by-date  also order the photos by when they were taken, and
//                                              set the trip's date and "when" from them
//
// For each photo it writes public/photos/<trip-id>/<id>-<width>.webp at up to
// three sizes (480 for grids, 800 for the board, 1600 for full screen; a size
// is skipped when the original is smaller, and the original width is used
// instead), and records the photo in src/data/trips/<trip-id>.json:
//
//   id, w, h        photo id (file name) and its size, so layouts never jump
//   bg              average color, shown while the photo loads
//   widths          the sizes that exist
//   taken           the day it was taken (YYYY-MM-DD), from the original's EXIF; the
//                   date only, never the time or place
//   caption, alt    yours; kept as they are on every run. New photos start empty.
//
// The order of "photos" in the JSON is the display order: reorder it by hand.
// New photos are appended. Location and camera data are never copied into the
// output. Originals belong in photos-src/, which is not committed.
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { takenDate } from './exif-date.mjs';

const [tripId, ...flags] = process.argv.slice(2);
if (!tripId || tripId.startsWith('-')) {
  console.error('usage: node scripts/photos.mjs <trip-id> [--web] [--force]');
  process.exit(1);
}
const web = flags.includes('--web');
const force = flags.includes('--force');
const byDate = flags.includes('--by-date');

const SIZES = [480, 800, 1600];
const outDir = path.join('public', 'photos', tripId);
const srcDir = web ? outDir : path.join('photos-src', tripId);
const manifestPath = path.join('src', 'data', 'trips', `${tripId}.json`);

if (!existsSync(srcDir)) {
  console.error(`no source folder: ${srcDir}\nput the originals there first`);
  process.exit(1);
}
await mkdir(outDir, { recursive: true });
await mkdir(path.dirname(manifestPath), { recursive: true });

const trip = existsSync(manifestPath)
  ? JSON.parse(await readFile(manifestPath, 'utf8'))
  : {
      id: tripId,
      title: tripId.replace(/(^|-)([a-z])/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase()),
      when: '',
      date: '',
      photos: [],
    };
const byId = new Map(trip.photos.map((p) => [p.id, p]));

const files = (await readdir(srcDir))
  .filter((f) => /\.(jpe?g|png|heic|tiff?)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // Florence-2 before Florence-10
if (!files.length) {
  console.log('nothing to encode');
  process.exit(0);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

let encoded = 0, kept = 0;
for (const file of files) {
  const id = slug(path.parse(file).name);
  const input = path.join(srcDir, file);
  const meta = await sharp(input).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;
  // sizes smaller than the original, plus the original's own width (up to 1600)
  const widths = [...new Set([...SIZES.filter((s) => s < w), Math.min(w, SIZES.at(-1))])].sort((a, b) => a - b);

  const srcTime = (await stat(input)).mtimeMs;
  const outputs = widths.map((wd) => path.join(outDir, `${id}-${wd}.webp`));
  const fresh = !force && outputs.every((o) => existsSync(o)) && (await Promise.all(outputs.map((o) => stat(o)))).every((s) => s.mtimeMs >= srcTime);

  if (!fresh) {
    for (const wd of widths) {
      await sharp(input)
        .rotate() // apply the camera's orientation; metadata is not carried over
        .resize({ width: wd, withoutEnlargement: true })
        .webp({ quality: wd <= 480 ? 74 : wd <= 800 ? 78 : 74 })
        .toFile(path.join(outDir, `${id}-${wd}.webp`));
    }
    encoded++;
  } else kept++;

  const { data } = await sharp(input).rotate().resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const entry = byId.get(id) ?? { id, caption: '', alt: '' };
  const taken = takenDate(meta.exif) ?? entry.taken;
  Object.assign(entry, { id, w, h, bg: hex(data[0], data[1], data[2]), widths });
  if (taken) entry.taken = taken;
  if (!byId.has(id)) {
    byId.set(id, entry);
    trip.photos.push(entry);
    console.log(`new: ${id} (${w}x${h}), sizes ${widths.join(', ')}`);
  }
}

if (byDate) {
  // oldest first; photos without a date go last; ties keep their current order
  const rank = new Map(trip.photos.map((p, i) => [p.id, i]));
  trip.photos.sort((a, b) => (a.taken ?? '9999').localeCompare(b.taken ?? '9999') || rank.get(a.id) - rank.get(b.id));
  const days = trip.photos.map((p) => p.taken).filter(Boolean).sort();
  if (days.length) {
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [y1, m1] = days[0].split('-'), [y2, m2] = days.at(-1).split('-');
    trip.date = `${y1}-${m1}`;
    trip.when = y1 === y2 && m1 === m2 ? `${MONTHS[+m1 - 1]} ${y1}` : y1 === y2 ? `${MONTHS[+m1 - 1]} to ${MONTHS[+m2 - 1]} ${y1}` : `${MONTHS[+m1 - 1]} ${y1} to ${MONTHS[+m2 - 1]} ${y2}`;
  }
}

// keep each key in a steady order so diffs stay small
const line = (p) => JSON.stringify({ id: p.id, w: p.w, h: p.h, taken: p.taken, bg: p.bg, widths: p.widths, caption: p.caption ?? '', alt: p.alt ?? '' });
const head = { ...trip };
delete head.photos;
const text = JSON.stringify(head, null, 2).replace(/\n}$/, ',\n  "photos": [\n    ' + trip.photos.map(line).join(',\n    ') + '\n  ]\n}') + '\n';
await writeFile(manifestPath, text);

const missingAlt = trip.photos.filter((p) => !p.alt).map((p) => p.id);
console.log(`${trip.title}: ${trip.photos.length} photos (${encoded} encoded, ${kept} already up to date) -> ${manifestPath}`);
if (!trip.when || !trip.date) console.log('fill in "when" (for example "May 2027") and "date" (2027-05) in the trip file');
if (missingAlt.length) console.log(`add alt text for: ${missingAlt.join(', ')}`);
