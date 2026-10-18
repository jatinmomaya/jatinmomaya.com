# Photos

One folder per photobook chapter. The folder name is the chapter id and must
match the id in `src/components/photobook/chapters.ts`.

## Adding a new chapter

1. Put the full-size originals in `public/photos/<chapter-id>/src/`.
2. Run `npm run photos -- <chapter-id>` from `personal-website/`. It writes
   `NN.jpg` (1170px wide, quality 68, for the photobook) and `t/NN.jpg`
   (800px wide, for the pinboard prints), numbered in file-name order. A
   19-photo chapter lands around 2.6 MB for the photobook plus 1.3 MB of
   thumbnails. Delete `src/` before committing; originals do not belong in git.
3. Add a data file `src/components/photobook/<id>.ts` (copy `mexico.ts`):
   one entry per photo with `src`, `caption`, `alt`, and the intrinsic
   `width`/`height` of the `NN.jpg` (prevents layout shift).
4. Register the chapter in `CHAPTERS` inside
   `src/components/photobook/chapters.ts`.
5. To hang photos on the pinboard, set `photo:` (an index into the chapter)
   on a print slot in `src/data/board.ts`. A portrait slot takes a portrait
   photo.

Rebuilding only the thumbnails from the existing web versions:
`npm run photos -- <chapter-id> --thumbs`.
