// Re-encode a photobook chapter for the web, and make the small versions the
// pinboard uses. Run from the personal-website directory:
//
//   node scripts/photos.mjs mexico            originals in public/photos/mexico/src/
//   node scripts/photos.mjs mexico --thumbs   only rebuild thumbnails from the web versions
//
// Output, per chapter folder:
//   NN.jpg      1170px wide, JPEG quality 68, progressive  (the photobook)
//   t/NN.jpg    800px wide, JPEG quality 72, progressive   (pinboard prints)
//
// Photos are never imported by code, only referenced by URL, so none of this
// ends up in the JS bundle. Add the intrinsic width and height of each NN.jpg
// to the chapter data file (src/components/photobook/<id>.ts).
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [chapter, flag] = process.argv.slice(2);
if (!chapter) {
  console.error('usage: node scripts/photos.mjs <chapter-id> [--thumbs]');
  process.exit(1);
}

const base = path.join('public', 'photos', chapter);
const srcDir = path.join(base, 'src');
const thumbDir = path.join(base, 't');
await mkdir(thumbDir, { recursive: true });

async function thumb(from, name) {
  await sharp(from)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 72, progressive: true, mozjpeg: true })
    .toFile(path.join(thumbDir, name));
}

if (flag === '--thumbs') {
  const files = (await readdir(base)).filter((f) => /^\d\d\.jpg$/.test(f)).sort();
  for (const f of files) {
    await thumb(path.join(base, f), f);
    console.log(`t/${f}`);
  }
  process.exit(0);
}

if (!existsSync(srcDir)) {
  console.error(`no source directory: ${srcDir}\nput originals there first`);
  process.exit(1);
}
const originals = (await readdir(srcDir))
  .filter((f) => /\.(jpe?g|png|heic)$/i.test(f))
  .sort();
let n = 0;
for (const name of originals) {
  n += 1;
  const out = `${String(n).padStart(2, '0')}.jpg`;
  const info = await sharp(path.join(srcDir, name))
    .rotate()
    .resize({ width: 1170, withoutEnlargement: true })
    .jpeg({ quality: 68, progressive: true, mozjpeg: true })
    .toFile(path.join(base, out));
  await thumb(path.join(base, out), out);
  console.log(`${name} -> ${out} (${info.width}x${info.height}) + t/${out}`);
}
