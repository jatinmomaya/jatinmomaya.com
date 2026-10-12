You are working in /home/hatch/workspace/website-dev/personal-website, a Next.js 15 + React 19 + TypeScript + Tailwind CSS 3 project.

## Reference materials (read both first)
- docs/shelf-mockup-v6.html — the approved visual mockup (v6). This is the design to implement faithfully.
- docs/shelf-concept-brief-2026-10-04.md — the concept brief with the full interaction spec.

## Task
Rebuild the homepage (src/app/page.tsx) as the interactive "shelf room" scene from the v6 mockup, engineered as proper React components. The v6 mockup is a single flat HTML file with one script tag — upgrade it into a real component architecture.

## Components to create in src/components/
- RoomScene — the full-viewport scene container (plaster wall, vignette, floor, film grain)
- Bookshelf — the oak floating shelf holding the navigation books
- Book — an individual book with spine + cover; owns its hover/touch/keyboard interaction state
- FloorLamp — the lamp with its warm glow pooling on the wall
- PictureFrame — the framed wall prints
- BrassPlaque — the small engraved name plaque

Use TypeScript throughout. Extract the design tokens (wall gradient stops, oak tones, brass gradient, book spine colors) into a shared module so they are defined once.

## Interaction spec (from the brief — implement all of it)
- First load: one-time staggered intro, each book's cover peeks out and settles, left to right. This teaches visitors the books are interactive.
- Hover a spine: 80ms hover-intent delay before opening (so sweeping the cursor doesn't trigger all three); the book lifts slightly, its cover pops toward the viewer with a subtle 3D tilt. Closing is instant with a quick ease-out, no springy close.
- Touch devices (no hover): first tap reveals the cover with a small "→" cue, second tap navigates.
- Keyboard: tabbing to a book reveals its cover, Enter navigates, Escape closes any open cover. Focus ring styled in-world (dark bronze + soft glow, not neon blue).
- prefers-reduced-motion: skip the intro entirely.
- Accessibility: real h1, nav with aria-label, descriptive link labels, aria-expanded on the touch toggle.

## Design requirements
- Three navigation books, left-anchored against a small dark-metal bookend: Photos (deep green spine), Field notes (kraft tan spine), About (navy blue spine). The long empty stretch to the right is intentional — room to grow. Do not center the books.
- Two thin black picture frames on the wall, a tall floor lamp on the right with warm glow, medium-oak floor on the bottom ~13% with a slim white baseboard.
- Small brass plaque top-left reading "Jatin Momaya". No tagline, no footer, no hint text.
- Georgia serif for text. Warm cream palette, light neutral — never yellow, never cartoonish.
- Responsive: desktop and mobile, landscape and portrait. On mobile the shelf cluster stays centered and the cover reveal must never be clipped.

## Constraints
- No em dashes in any visible copy. No lorem ipsum, no "Welcome to My Personal Website" — all placeholder starter text must go.
- Replace the placeholder homepage entirely. Do not touch the other pages yet.
- After implementing, run `npm run build` and fix ALL errors and warnings so the build is fully green — including the existing react/no-unescaped-entities error in src/app/products/page.tsx.
- Do NOT commit or push anything. Leave changes uncommitted for review.
- Set TMPDIR=/home/hatch/workspace/.tmp for any npm/npx commands (/tmp on this machine is a tiny ramdisk).
