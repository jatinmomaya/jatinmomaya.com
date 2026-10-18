#!/usr/bin/env node
/**
 * Checks the hand-edited data files before they reach the site. A typo in
 * one of these would otherwise show up as a broken page, so the build and the
 * pull-request check run this first. Run from the personal-website directory:
 *
 *   npm run check:data
 *
 * Covers books.json, favorites.json and writing.json. (Trip files and photos
 * are checked by check-assets.mjs.) Errors exit with 1.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const errors = [];
const err = (file, where, msg) => errors.push(`${file}: ${where}: ${msg}`);

const read = async (file) => {
  try {
    return JSON.parse(await readFile(path.join('src', 'data', file), 'utf8'));
  } catch (e) {
    err(file, 'file', `cannot be read as JSON (${e.message})`);
    return null;
  }
};

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const isCount = (v) => Number.isInteger(v) && v > 0;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---- books.json ----
{
  const f = 'books.json';
  const data = await read(f);
  if (data) {
    const books = data.books;
    if (!Array.isArray(books)) err(f, 'books', 'must be an array');
    else {
      const seen = new Set();
      books.forEach((b, i) => {
        const where = `books[${i}]${b?.id ? ` (${b.id})` : ''}`;
        if (!isText(b.id) || !SLUG.test(b.id)) err(f, where, 'id must be a lowercase slug');
        else if (seen.has(b.id)) err(f, where, 'duplicate id');
        else seen.add(b.id);
        if (!isText(b.title)) err(f, where, 'title is empty');
        if (!isText(b.author)) err(f, where, 'author is empty');
        if (b.status !== 'reading' && b.status !== 'read') err(f, where, `status must be "reading" or "read", not ${JSON.stringify(b.status)}`);
        if (b.pages !== undefined && !isCount(b.pages)) err(f, where, 'pages must be a positive whole number');
        if (b.rating !== undefined && !(Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5)) err(f, where, 'rating must be 1 to 5');
        if (b.finished !== undefined && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(b.finished)) err(f, where, 'finished must look like 2026, 2026-09 or 2026-09-24');
        if (b.spine !== undefined && !isHex(b.spine)) err(f, where, 'spine must be a #rrggbb color');
        if (b.ink !== undefined && !isHex(b.ink)) err(f, where, 'ink must be a #rrggbb color');
        if (b.goodreadsId !== undefined && !/^\d+$/.test(String(b.goodreadsId))) err(f, where, 'goodreadsId must be digits');
        if (b.cover === true && !existsSync(path.join('public', 'books', 'covers', `${b.id}.webp`))) {
          err(f, where, `cover is true but public/books/covers/${b.id}.webp does not exist`);
        }
      });
      if (!books.some((b) => b.status === 'reading')) {
        // not an error: an empty "Reading now" shelf is allowed, but it is worth a note
        console.log('note: no book is marked "reading", so the Reading now shelf will be empty');
      }
    }
  }
}

// ---- favorites.json ----
{
  const f = 'favorites.json';
  const data = await read(f);
  if (data) {
    const items = data.items;
    if (!Array.isArray(items) || items.length === 0) err(f, 'items', 'must be a non-empty array (run `npm run favorites`)');
    else {
      const seen = new Set();
      items.forEach((it, i) => {
        const where = `items[${i}]${it?.id ? ` (${it.id})` : ''}`;
        if (!isText(it.id) || !SLUG.test(it.id)) err(f, where, 'id must be a lowercase slug');
        else if (seen.has(it.id)) err(f, where, 'duplicate id');
        else seen.add(it.id);
        if (!isText(it.title)) err(f, where, 'title is empty');
        if (!isText(it.author)) err(f, where, 'author is empty');
        if (it.pages !== undefined && !isCount(it.pages)) err(f, where, 'pages must be a positive whole number');
        if (it.count !== undefined && !(Number.isInteger(it.count) && it.count > 1)) err(f, where, 'count (a box set) must be 2 or more');
        if (!Array.isArray(it.books)) err(f, where, 'books must be an array (empty for a single book)');
        else {
          it.books.forEach((b, j) => {
            if (!isText(b.title)) err(f, `${where}.books[${j}]`, 'title is empty');
            if (!Number.isInteger(b.order) || b.order < 1) err(f, `${where}.books[${j}]`, 'order must be a whole number from 1');
          });
          if (it.books.length === 1) err(f, where, 'a series of one book should be a single book');
        }
      });
    }
  }
}

// ---- writing.json ----
{
  const f = 'writing.json';
  const data = await read(f);
  if (data) {
    const posts = data.posts;
    if (!Array.isArray(posts)) err(f, 'posts', 'must be an array');
    else {
      posts.forEach((p, i) => {
        const where = `posts[${i}]${p?.title ? ` (${p.title})` : ''}`;
        if (!isText(p.title)) err(f, where, 'title is empty');
        if (p.placeholder !== true) {
          if (!/^\d{4}-\d{2}$/.test(p.date ?? '')) err(f, where, 'a real post needs a date like 2026-10');
          if (!isText(p.href)) err(f, where, 'a real post needs an href');
        }
        if (p.href !== undefined && !/^(https?:\/\/|\/)/.test(p.href)) err(f, where, 'href must start with https:// or /');
      });
      const drafts = posts.filter((p) => p.placeholder).length;
      if (drafts) console.log(`note: ${drafts} placeholder post(s) are still listed under Writing`);
    }
  }
}

if (errors.length) {
  console.error(`\n${errors.length} data problem(s):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('data: books.json, favorites.json and writing.json are consistent');
