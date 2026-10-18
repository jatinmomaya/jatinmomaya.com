# Photos

One folder per trip: `public/photos/<trip-id>/`. Each trip also has one data
file, `src/data/trips/<trip-id>.json`, which is the only thing the site reads.
A new trip shows up on the board and on `/trips` as soon as its file exists;
there is nothing else to register or place.

## Adding a trip

1. Put the full-size originals in `photos-src/<trip-id>/` (not committed).
2. From `personal-website/`, run `npm run photos -- <trip-id>`.
   It makes each photo at up to three sizes (480, 800 and 1600 wide, WebP),
   records its size and average color, and writes the trip file. Location and
   camera data are never copied. Re-running is safe: it only encodes new photos
   and keeps your captions.
3. Open `src/data/trips/<trip-id>.json` and fill in `title`, `when` (the text
   people see, such as "May 2027") and `date` (`2027-05`, used to sort trips
   newest first). Write a `caption` and `alt` for each photo. Alt text is a
   short description for people who can't see it.
4. The order of `photos` is the order in the grid. The first photo is the
   cover; the first four make the stack. Reorder lines by hand to change that.
5. `npm run check:assets` shows sizes against the budget. It also runs before
   every `npm run export:root`.

`npm run photos -- <trip-id> --force` re-encodes everything for a trip.

## How loading stays light

- The homepage receives only each trip's title, count and four stack photos.
  It loads the 480px size of those (about 30 KB each).
- A trip's full photo list is a separate chunk that loads when the trip opens.
- Grid photos load lazily as rows scroll near, each with its size and a color
  placeholder reserved, so nothing jumps. The full-screen size loads only when
  a photo is opened, and only its neighbors are preloaded.

## Budgets and when to move off git

`scripts/check-assets.mjs` holds the numbers. Photos live in git, so every
photo stays in the repo's history. At about 20 MB for one trip, or 120 MB in
total, it warns; at 200 MB in total it fails. When that happens, move the image
files to storage with a CDN (Cloudflare R2 or Vercel Blob) and point
`photoUrl()` in `src/lib/trips.ts` at it. The trip files stay in git.
