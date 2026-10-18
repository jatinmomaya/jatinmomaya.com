# Book covers

`covers/<book-id>.webp` are front covers, 240px wide, one per book. The shelf
shows a real cover when a book has `"cover": true` in `src/data/books.json`,
and a typeset cover otherwise.

Covers, spine colors and page counts come from the public Goodreads feed:

    node scripts/covers.mjs          covers for the books the shelf shows (SHELF_MAX)
    node scripts/covers.mjs --force  redo covers that already exist
    node scripts/covers.mjs --all    every book (about 20 KB each)

The script sets `cover`, `spine` (the cover's average color, toned to read as a
spine), `ink` (title color on that spine) and `pages` (spine thickness) in
`books.json`. Goodreads only has front covers, so spines are approximated, not
photographed. Add a book by hand without a cover and it gets a generated spine.

The older `*.jpg` files in this folder belong to the legacy `/bookshelf` page,
not the shelf on the homepage.
