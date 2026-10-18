// Generates public/textures/cork.jpg: a seamless cork tile for the pinboard.
// The output is committed; rerun only to change the look:
//   node scripts/make-textures.mjs
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SIZE = 320;
const base = [180, 133, 79]; // #b4854f
const flecks = [
  [143, 98, 52], [199, 154, 98], [169, 120, 74], [214, 172, 116], [122, 82, 41], [184, 139, 85],
];

// small seeded generator so the texture is the same every run
let seed = 20261017;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

const px = new Float32Array(SIZE * SIZE * 3);
for (let i = 0; i < SIZE * SIZE; i++) {
  px[i * 3] = base[0];
  px[i * 3 + 1] = base[1];
  px[i * 3 + 2] = base[2];
}

// blobs wrap at the edges, so the tile repeats without a seam
function blob(cx, cy, r, color, alpha) {
  const rx = r, ry = r * (0.6 + rnd() * 0.7), rot = rnd() * Math.PI;
  const cos = Math.cos(rot), sin = Math.sin(rot), reach = Math.ceil(Math.max(rx, ry)) + 1;
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const u = (dx * cos + dy * sin) / rx, v = (-dx * sin + dy * cos) / ry;
      if (u * u + v * v > 1) continue;
      const x = (Math.round(cx) + dx + SIZE) % SIZE, y = (Math.round(cy) + dy + SIZE) % SIZE;
      const o = (y * SIZE + x) * 3;
      for (let c = 0; c < 3; c++) px[o + c] += (color[c] - px[o + c]) * alpha;
    }
  }
}
for (let i = 0; i < 3600; i++) {
  blob(rnd() * SIZE, rnd() * SIZE, 0.5 + rnd() * 2.8, flecks[i % flecks.length], 0.2 + rnd() * 0.45);
}

await mkdir('public/textures', { recursive: true });
const raw = Buffer.from(px.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
await sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 3 } })
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile('public/textures/cork.jpg');
console.log('public/textures/cork.jpg');
