// Publish the static build to the repo root, where Vercel serves it.
//
// Vercel does not build this app: it serves the repo root as static files, and
// the root _next/ and top-level files are committed build output. After
// `npm run build`, this script does the export the same way every time:
//
//   0. check photo and cover sizes against their budgets (scripts/check-assets.mjs)
//   1. wipe the repo-root _next/
//   2. copy everything in out/ over the repo root (overwrite)
//   3. remove files an earlier export wrote that this build no longer produces
//      (a deleted page, a re-encoded photo, a dropped asset), using the list the
//      last export saved in .export-manifest.json. Files that were never part of
//      an export (docs/, design-prototype/, personal-website/, styles.css) are
//      never touched.
//   4. check that every /_next/... file and every url(/...) the pages and
//      stylesheets point at actually exists at the root
//
// Usage, from the personal-website directory:
//   node scripts/export-root.mjs             do it
//   node scripts/export-root.mjs --dry-run   change nothing; check out/ only
import { cp, readdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Photos and covers must be within budget before anything is published. The
// check exits the process with an error if they are not.
await import('./check-assets.mjs');

const dry = process.argv.includes('--dry-run');
const out = path.resolve('out');
const root = path.resolve('..');

const exists = (p) => stat(p).then(() => true, () => false);

const MANIFEST = '.export-manifest.json';
// Never removed, whatever a manifest says.
const PROTECTED = ['.git/', '.gitignore', 'docs/', 'design-prototype/', 'personal-website/', 'styles.css', MANIFEST];
// Used once, until the first manifest exists: what the starter site and the
// earlier corkboard exports left in the root that the current build no longer makes.
const LEGACY = [
  'products.html', 'products.txt', 'photography.html', 'photography.txt',
  'bookshelf.html', 'bookshelf.txt', 'blog.html', 'blog.txt',
  'file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg',
  'textures/cork.jpg',
  'books/kitchen-confidential.jpg', 'books/never-finished.jpg', 'books/steve-jobs.jpg', 'books/README.md',
  'photos/2022/december/photo1.jpg',
  'photos/2023/february/photo1.jpg', 'photos/2023/january/photo1.jpg', 'photos/2023/january/photo2.jpg',
];

const isProtected = (rel) => PROTECTED.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

/** Every file under `dir`, as forward-slash paths relative to it. */
async function listFiles(dir, base = dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await listFiles(full, base, acc);
    else acc.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return acc;
}

/** What an earlier export wrote, minus what this build still makes. */
async function staleFiles(newFiles) {
  let previous = LEGACY;
  let source = 'the one-time legacy list';
  if (await exists(path.join(root, MANIFEST))) {
    previous = JSON.parse(await readFile(path.join(root, MANIFEST), 'utf8')).files ?? [];
    source = MANIFEST;
  }
  const keep = new Set(newFiles);
  const stale = [];
  for (const rel of previous) {
    const abs = path.resolve(root, rel);
    if (!abs.startsWith(root + path.sep) || isProtected(rel) || keep.has(rel)) continue;
    if (await exists(abs)) stale.push(rel);
  }
  return { stale, source };
}

if (!(await exists(path.join(out, 'index.html')))) {
  console.error('out/index.html is missing. Run `npm run build` first.');
  process.exit(1);
}

const target = dry ? out : root;
const newFiles = await listFiles(out);
const { stale, source } = await staleFiles(newFiles);

if (!dry) {
  await rm(path.join(root, '_next'), { recursive: true, force: true });
  console.log('wiped _next/');
  for (const name of await readdir(out)) {
    await cp(path.join(out, name), path.join(root, name), { recursive: true, force: true });
  }
  console.log('copied out/ over the repo root');
  for (const rel of stale) {
    await rm(path.resolve(root, rel), { force: true });
    // drop folders the removal left empty (never the root itself)
    let dir = path.dirname(path.resolve(root, rel));
    while (dir !== root && dir.startsWith(root + path.sep)) {
      try {
        await rmdir(dir);
      } catch {
        break;
      }
      dir = path.dirname(dir);
    }
  }
  console.log(`removed ${stale.length} stale file(s) (from ${source})`);
  await writeFile(path.join(root, MANIFEST), JSON.stringify({ files: [...newFiles].sort() }, null, 1) + '\n');
  console.log(`saved ${MANIFEST} (${newFiles.length} files)`);
} else {
  console.log('dry run: nothing changed, checking out/ only');
  console.log(`would remove ${stale.length} stale file(s) (from ${source})${stale.length ? ':' : ''}`);
  for (const rel of stale) console.log('  ' + rel);
}

// ---- check: nothing may point at a file that isn't there ----
async function walk(dir, ext, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, ext, acc);
    else if (ext.some((e) => entry.name.endsWith(e))) acc.push(full);
  }
  return acc;
}

const missing = new Set();
const refs = /(?:src|href)="(\/[^"#?]+)|url\((\/[^)"'#?]+)|"(\/_next\/[^"?]+)/g;
const pages = (await readdir(target)).filter((f) => f.endsWith('.html')).map((f) => path.join(target, f));
const styles = await walk(path.join(target, '_next', 'static', 'css'), ['.css']);
for (const file of [...pages, ...styles]) {
  const text = await readFile(file, 'utf8');
  for (const m of text.matchAll(refs)) {
    const ref = decodeURIComponent(m[1] || m[2] || m[3]);
    if (ref === '/' || ref.startsWith('//')) continue;
    // a page route like /trips is served from trips.html (or trips/index.html)
    const found = (await exists(path.join(target, ref))) || (await exists(path.join(target, `${ref}.html`))) || (await exists(path.join(target, ref, 'index.html')));
    if (!found) missing.add(`${ref}   (in ${path.relative(target, file)})`);
  }
}

if (missing.size) {
  console.error(`\n${missing.size} reference(s) point at files that do not exist:`);
  for (const m of missing) console.error('  ' + m);
  process.exit(1);
}
console.log(`ok: ${pages.length} pages and ${styles.length} stylesheets, every reference resolves`);
