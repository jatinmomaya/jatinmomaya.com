# Photos

One folder per photobook chapter. The folder name is the chapter id and must
match the id in `src/components/photobook/chapters.ts`.

## Adding a new chapter

1. Export full-size originals however you like, then re-encode for the web:
   `personal-website/scripts/optimize-photos.sh <chapter-id>/`.
   This resizes to 1170px wide, JPEG quality 68, progressive. A 19-photo
   chapter lands around 2.6 MB total.
2. Number files `01.jpg`, `02.jpg`, … in display order.
3. Add a data file `src/components/photobook/<id>.ts` (copy `mexico.ts`):
   one entry per photo with `src`, `caption`, `alt`, and the intrinsic
   `width`/`height` (prevents layout shift; read them from the file).
4. Register the chapter in `CHAPTERS` inside
   `src/components/photobook/chapters.ts`.
5. Point a shelf book at it in `Bookshelf.tsx` via
   `openChapter('<book-id>', '<chapter-id>')`.

## Rules that keep the site fast

- Reference photos by URL string (`/photos/<id>/01.jpg`), never `import`
  them — imports would bundle photo bytes into the JavaScript.
- Images only load when their chapter is opened. The overlay preloads
  neighbors as you turn pages; nothing else fetches ahead.
- Keep originals out of the repo; only the re-encoded web versions live here.
