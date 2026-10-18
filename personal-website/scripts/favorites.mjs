#!/usr/bin/env node
/**
 * Reads the "favorites" shelf from the public Goodreads feed and writes
 * src/data/favorites.json. Books that belong to the same series collapse
 * into one shelf item that lists its books.
 *
 *   npm run favorites            fetch and write
 *   npm run favorites -- --dry   print, write nothing
 *
 * Only the shelf name decides what is here: add a book to your Goodreads
 * "favorites" shelf and it shows up after the next run. Nothing is invented:
 * titles, authors and page counts come straight from the feed.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const USER = '63309652';
const SHELF = 'favorites';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'favorites.json');
const dry = process.argv.includes('--dry');

const url = `https://www.goodreads.com/review/list_rss/${USER}?shelf=${SHELF}&per_page=200`;
const res = await fetch(url, { headers: { 'user-agent': 'jatinmomaya.com favorites sync' } });
if (!res.ok) throw new Error(`Goodreads answered ${res.status}`);
const xml = await res.text();

const field = (item, tag) => {
  const m = item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1].trim() : '';
};
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const items = xml
  .split('<item>')
  .slice(1)
  .map((item) => {
    const raw = field(item, 'title');
    const series = raw.match(/\((.+?),?\s*#(\d+(?:\.\d+)?)\)\s*$/);
    const boxMatch = raw.match(/#(\d+)-(\d+)\)\s*$/);
    const title = raw.replace(/\s*\(.*?#\d+(?:[.-]\d+)?\)\s*$/, '').split(':')[0].trim();
    return {
      goodreadsId: field(item, 'book_id'),
      title,
      author: field(item, 'author_name').replace(/\s+/g, ' '),
      pages: Number(field(item, 'num_pages')) || undefined,
      series: series ? series[1].replace(/^The\s+/, '').trim() : null,
      order: series ? Number(series[2]) : 0,
      // a box set such as "The Inheritance Cycle (#1-4)" is a series on its own
      boxSet: Boolean(boxMatch),
      count: boxMatch ? Number(boxMatch[2]) - Number(boxMatch[1]) + 1 : 1,
    };
  });

// Collapse into shelf items, keeping the order the feed gives (newest added first).
const shelf = [];
const bySeries = new Map();
for (const b of items) {
  if (b.series && !b.boxSet) {
    let group = bySeries.get(b.series);
    if (!group) {
      group = { id: slug(b.series), title: b.series, author: b.author, pages: 0, books: [] };
      bySeries.set(b.series, group);
      shelf.push(group);
    }
    group.books.push({ title: b.title, order: b.order, goodreadsId: b.goodreadsId });
    group.pages += b.pages ?? 0;
  } else {
    shelf.push({
      id: slug(b.title),
      title: b.title,
      count: b.boxSet ? b.count : undefined,
      author: b.author,
      pages: b.pages,
      books: [],
      goodreadsId: b.goodreadsId,
    });
  }
}
for (const g of bySeries.values()) g.books.sort((a, b) => a.order - b.order);
for (const g of bySeries.values()) {
  if (g.books.length === 1) {
    // one volume of a series is just a book
    const only = g.books[0];
    Object.assign(g, { id: slug(only.title), title: only.title, books: [], goodreadsId: only.goodreadsId, pages: g.pages || undefined });
  }
}

const merged = shelf;

const json = JSON.stringify({ shelf: SHELF, items: merged }, null, 1) + '\n';
if (dry) process.stdout.write(json);
else {
  writeFileSync(OUT, json);
  console.log(`favorites: ${merged.length} shelf items from ${items.length} books -> src/data/favorites.json`);
}
