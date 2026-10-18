// Make the shelf look like the real books.
//
//   node scripts/covers.mjs              covers for the books the shelf shows
//   node scripts/covers.mjs --force      redo covers that already exist
//   node scripts/covers.mjs --all        covers for every book in books.json
//
// Reads the public Goodreads RSS feed for the shelf owner (no key needed),
// matches books by `goodreadsId`, and for each book:
//   - records its page count (spine thickness follows it), for every book
//   - for the target books, downloads the front cover, saves a 240px-wide
//     webp to public/books/covers/<id>.webp, and sets `cover`, `spine` (the
//     cover's average color, toned to read as a spine) and `ink` (title color)
// then rewrites src/data/books.json. Re-running is safe.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const USER = '63309652';
const BOOKS = 'src/data/books.json';
const COVERS = 'public/books/covers';
const force = process.argv.includes('--force');
const all = process.argv.includes('--all');

const data = JSON.parse(await readFile(BOOKS, 'utf8'));
const books = data.books;
const shelfMax = Number((await readFile('src/lib/books.ts', 'utf8')).match(/SHELF_MAX = (\d+)/)?.[1] ?? 12);

// ---- the feed: page counts and cover URLs, keyed by Goodreads book id ----
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  const c = m[1].trim().match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return unescape((c ? c[1] : m[1]).trim());
};
const info = new Map();
for (const shelf of ['currently-reading', 'read']) {
  for (let page = 1; page < 10; page++) {
    const url = `https://www.goodreads.com/review/list_rss/${USER}?shelf=${shelf}&per_page=200&page=${page}`;
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    for (const it of items) {
      info.set(tag(it, 'book_id'), {
        pages: Number(tag(it, 'num_pages')) || undefined,
        image: tag(it, 'book_large_image_url'),
      });
    }
    if (items.length < 200) break;
  }
}
console.log(`feed: ${info.size} books`);

// ---- which books get covers: the ones the shelf shows (keep in step with sortBooks) ----
const rank = (b) => (b.status === 'reading' ? 0 : 1);
const sorted = books
  .map((b, i) => ({ b, i }))
  .sort((x, y) => {
    if (rank(x.b) !== rank(y.b)) return rank(x.b) - rank(y.b);
    const dx = x.b.finished ?? '', dy = y.b.finished ?? '';
    if (dx !== dy) return dx < dy ? 1 : -1;
    return x.i - y.i;
  })
  .map((x) => x.b);
const targets = new Set((all ? sorted : sorted.slice(0, shelfMax)).map((b) => b.id));

// ---- color: the cover's average, toned so it reads as a spine ----
function toSpine([r, g, b]) {
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2;
  const d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (mx === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (mx === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const L = Math.min(0.78, Math.max(0.16, l));
  const S = Math.min(0.75, s * 0.9);
  const c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = L - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const hex = [r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
  return { color: `#${hex}`, light: L > 0.55 };
}

await mkdir(COVERS, { recursive: true });
let got = 0, skipped = 0, noimg = 0;
for (const book of books) {
  const rec = info.get(book.goodreadsId ?? '');
  if (rec?.pages) book.pages = rec.pages;
  if (!targets.has(book.id)) continue;
  const file = `${COVERS}/${book.id}.webp`;
  if (existsSync(file) && !force && book.cover && book.spine) { skipped++; continue; }
  if (!rec?.image || /nophoto/.test(rec.image)) { noimg++; console.log(`no cover image: ${book.title}`); continue; }
  const res = await fetch(rec.image, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.log(`skip ${book.title}: ${res.status}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize({ width: 240, withoutEnlargement: true }).webp({ quality: 80 }).toFile(file);
  // average color, weighting colorful pixels over washed-out ones
  const px = await sharp(buf).resize(24, 24, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  let wr = 0, wg = 0, wb = 0, wt = 0;
  for (let i = 0; i < px.length; i += 3) {
    const sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
    const w = 1 + sat / 40;
    wr += px[i] * w; wg += px[i + 1] * w; wb += px[i + 2] * w; wt += w;
  }
  const { color, light } = toSpine([wr / wt, wg / wt, wb / wt]);
  book.cover = true;
  book.spine = color;
  book.ink = light ? '#1f1a12' : '#efe3c9';
  got++;
  console.log(`${book.title}: ${color} ${(buf.length / 1024).toFixed(0)} KB source`);
  await new Promise((r) => setTimeout(r, 250));
}

await writeFile(BOOKS, JSON.stringify(data, null, 1) + '\n');
console.log(`covers: ${got} new, ${skipped} already there, ${noimg} without an image; page counts for ${books.filter((b) => b.pages).length} books`);
