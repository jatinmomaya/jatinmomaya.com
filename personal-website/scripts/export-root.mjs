// Publish the static build to the repo root, where Vercel serves it.
//
// Vercel does not build this app: it serves the repo root as static files, and
// the root _next/ and top-level files are committed build output. After
// `npm run build`, this script does the export the same way every time:
//
//   0. check photo and cover sizes against their budgets (scripts/check-assets.mjs)
//   1. wipe the repo-root _next/
//   2. copy everything in out/ over the repo root (overwrite; files that only
//      exist at the root, such as legacy pages, are left alone)
//   3. check that every /_next/... file and every url(/...) the pages and
//      stylesheets point at actually exists at the root
//
// Usage, from the personal-website directory:
//   node scripts/export-root.mjs             do it
//   node scripts/export-root.mjs --dry-run   change nothing; check out/ only
import { cp, readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

// Photos and covers must be within budget before anything is published. The
// check exits the process with an error if they are not.
await import('./check-assets.mjs');

const dry = process.argv.includes('--dry-run');
const out = path.resolve('out');
const root = path.resolve('..');

const exists = (p) => stat(p).then(() => true, () => false);

if (!(await exists(path.join(out, 'index.html')))) {
  console.error('out/index.html is missing. Run `npm run build` first.');
  process.exit(1);
}

const target = dry ? out : root;

if (!dry) {
  await rm(path.join(root, '_next'), { recursive: true, force: true });
  console.log('wiped _next/');
  for (const name of await readdir(out)) {
    await cp(path.join(out, name), path.join(root, name), { recursive: true, force: true });
  }
  console.log('copied out/ over the repo root');
} else {
  console.log('dry run: nothing changed, checking out/ only');
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
