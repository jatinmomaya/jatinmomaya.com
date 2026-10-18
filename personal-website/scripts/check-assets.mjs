// Size and consistency budget for photos and book covers. Run from the
// personal-website directory:
//
//   node scripts/check-assets.mjs            errors fail, warnings print
//   node scripts/check-assets.mjs --strict   warnings fail too
//
// It runs automatically before `npm run export:root`, so an oversized or
// broken photo can never reach the repo root by accident.
//
// Budgets (edit here, in one place):
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KB = 1024, MB = KB * KB;
const BUDGET = {
  // per file, by role
  grid: 75 * KB, // the 480px size
  mid: 190 * KB, // the 800px size
  full: 450 * KB, // the largest size
  // totals
  tripWarn: 20 * MB,
  tripFail: 35 * MB,
  allWarn: 120 * MB,
  allFail: 200 * MB,
  coversWarn: 6 * MB,
};

const strict = process.argv.includes('--strict');
const errors = [], warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const fmt = (n) => (n >= MB ? (n / MB).toFixed(1) + ' MB' : Math.round(n / KB) + ' KB');

const tripsDir = path.join('src', 'data', 'trips');
const photosDir = path.join('public', 'photos');
const manifests = existsSync(tripsDir) ? (await readdir(tripsDir)).filter((f) => f.endsWith('.json')).sort() : [];

let allBytes = 0;
const rows = [];
for (const f of manifests) {
  const trip = JSON.parse(await readFile(path.join(tripsDir, f), 'utf8'));
  const id = path.parse(f).name;
  if (trip.id !== id) err(`${f}: "id" is "${trip.id}", expected "${id}"`);
  if (!trip.title) err(`${f}: missing "title"`);
  if (!/^\d{4}-\d{2}$/.test(trip.date ?? '')) err(`${f}: "date" must look like 2026-09`);
  if (!trip.when) warn(`${f}: "when" is empty (the text shown on the stack)`);
  if (!Array.isArray(trip.photos) || !trip.photos.length) { err(`${f}: no photos`); continue; }

  const referenced = new Set();
  let bytes = 0;
  const seen = new Set();
  for (const p of trip.photos) {
    if (seen.has(p.id)) err(`${f}: duplicate photo id "${p.id}"`);
    seen.add(p.id);
    if (!Number.isInteger(p.w) || !Number.isInteger(p.h)) err(`${f}/${p.id}: missing width or height`);
    if (!p.alt) warn(`${f}/${p.id}: no alt text`);
    if (p.taken && !/^\d{4}-\d{2}-\d{2}$/.test(p.taken)) err(`${f}/${p.id}: "taken" must look like 2025-10-11`);
    if (!/^#[0-9a-f]{6}$/i.test(p.bg ?? '')) err(`${f}/${p.id}: missing "bg" color (run the photos script)`);
    const widths = p.widths ?? [];
    widths.forEach((wd, i) => {
      const file = path.join(photosDir, id, `${p.id}-${wd}.webp`);
      referenced.add(path.basename(file));
      if (!existsSync(file)) return err(`${f}/${p.id}: missing file ${path.relative('.', file)}`);
      return null;
    });
    for (const [i, wd] of widths.entries()) {
      const file = path.join(photosDir, id, `${p.id}-${wd}.webp`);
      if (!existsSync(file)) continue;
      const size = (await stat(file)).size;
      bytes += size;
      const cap = i === widths.length - 1 ? BUDGET.full : wd <= 480 ? BUDGET.grid : BUDGET.mid;
      if (size > cap) warn(`${path.relative('.', file)} is ${fmt(size)}, over its ${fmt(cap)} budget`);
      // published photos must carry no EXIF (camera, date, location)
      const meta = await sharp(file).metadata();
      if (meta.exif) err(`${path.relative('.', file)} contains EXIF metadata (location or camera data)`);
    }
  }
  // files in the trip folder that no photo uses
  const dir = path.join(photosDir, id);
  if (existsSync(dir)) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name === 'src') warn(`${path.relative('.', path.join(dir, 'src'))} holds originals; keep them in photos-src/, which is not committed`);
      else if (entry.isFile() && /\.(jpe?g|webp|png)$/i.test(entry.name) && !referenced.has(entry.name)) warn(`${path.join(id, entry.name)} is not used by ${f}`);
    }
  }
  allBytes += bytes;
  if (bytes > BUDGET.tripFail) err(`${f}: ${fmt(bytes)} of photos, over the ${fmt(BUDGET.tripFail)} limit for one trip`);
  else if (bytes > BUDGET.tripWarn) warn(`${f}: ${fmt(bytes)} of photos, over the ${fmt(BUDGET.tripWarn)} budget for one trip`);
  const dated = trip.photos.filter((p) => p.taken).length;
  rows.push(`  ${trip.title.padEnd(14)} ${String(trip.photos.length).padStart(4)} photos  ${fmt(bytes).padStart(8)}  ${dated}/${trip.photos.length} dated`);
}

if (allBytes > BUDGET.allFail) err(`all trips together are ${fmt(allBytes)}, over the ${fmt(BUDGET.allFail)} limit. Time to move photo files off git to storage with a CDN.`);
else if (allBytes > BUDGET.allWarn) warn(`all trips together are ${fmt(allBytes)}, over ${fmt(BUDGET.allWarn)}. Plan to move photo files off git.`);

const coversDir = path.join('public', 'books', 'covers');
if (existsSync(coversDir)) {
  let c = 0;
  for (const f of await readdir(coversDir)) c += (await stat(path.join(coversDir, f))).size;
  if (c > BUDGET.coversWarn) warn(`book covers are ${fmt(c)}, over ${fmt(BUDGET.coversWarn)}`);
  rows.push(`  ${'Book covers'.padEnd(14)} ${' '.repeat(11)}${fmt(c).padStart(8)}`);
}

console.log('assets:');
rows.forEach((r) => console.log(r));
console.log(`  ${'Trips total'.padEnd(14)} ${' '.repeat(11)}${fmt(allBytes).padStart(8)}`);
warnings.forEach((w) => console.log('warning: ' + w));
errors.forEach((e) => console.error('error: ' + e));
if (errors.length || (strict && warnings.length)) {
  console.error(`\n${errors.length} error(s)${strict ? `, ${warnings.length} warning(s)` : ''}`);
  process.exit(1);
}
console.log('ok');
