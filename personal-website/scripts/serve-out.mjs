// Serves out/ the way Vercel serves the exported site: /trips is trips.html,
// unknown paths are the 404 page. Used by the browser tests; nothing else.
//   node scripts/serve-out.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('out');
const port = Number(process.argv[2] ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const rel = path.normalize(url).replace(/^[/\\]+/, '');
  let file = path.join(root, rel);
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (!isFile(file)) {
    const candidates = [`${file}.html`, path.join(file, 'index.html')];
    file = candidates.find(isFile) ?? '';
  }
  if (!file) {
    res.writeHead(404, { 'content-type': types['.html'] });
    createReadStream(path.join(root, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving out/ at http://localhost:${port}`));
