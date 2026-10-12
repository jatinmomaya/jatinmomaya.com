You are QA-reviewing a homepage rebuild I just wrote. Be thorough, skeptical, and specific.

## What was built
In /home/hatch/workspace/website-dev/personal-website (Next.js 15 + React 19 + TypeScript + Tailwind 3), I rebuilt the homepage (src/app/page.tsx) as an interactive "shelf room" scene. New/changed files:
- src/app/page.tsx (renders RoomScene)
- src/app/room.module.css (all scene styles, ported from the mockup)
- src/app/layout.tsx (now uses ConditionalHeader so the starter header is hidden on "/")
- src/components/RoomScene.tsx, Bookshelf.tsx, Book.tsx, BookCovers.tsx, FloorLamp.tsx, PictureFrame.tsx, BrassPlaque.tsx, ConditionalHeader.tsx, designTokens.ts
- src/app/products/page.tsx (one-character lint fix: escaped apostrophe)

## Source of truth
- docs/shelf-mockup-v6.html — the approved visual mockup (v6). Compare against this carefully.
- docs/shelf-concept-brief-2026-10-04.md — the concept brief with the full interaction spec.

## What to check
1. **Visual fidelity**: does the React version match the mockup? Layout, colors, proportions, the lamp glow, frames, shelf, bookend, plaque. Note any pixel-level drift that matters.
2. **Interaction spec compliance** (from the brief): staggered intro peek on first load; 80ms hover-intent delay on spines; instant close; touch two-tap model; keyboard (tab reveals, Enter navigates, Escape closes); in-world focus ring; prefers-reduced-motion skips the intro.
3. **Accessibility**: real h1, nav aria-label, descriptive link labels, aria-expanded correctness, color contrast on spine titles, focus visibility.
4. **Responsive**: desktop, mobile, landscape/portrait. The cover reveal must never be clipped on mobile.
5. **Code quality**: TypeScript strictness, React best practices (hooks, keys, cleanup), CSS module correctness, dead code, the ConditionalHeader approach for hiding the starter header.
6. **Bugs**: anything that would break at runtime. Actually run `npm run build` (with TMPDIR=/home/hatch/workspace/.tmp) and confirm it is green; run `npx tsc --noEmit` if useful.

## How to verify interactions
You may start the dev server (`npx next dev -p 3100`, TMPDIR=/home/hatch/workspace/.tmp) and drive it with the Playwright setup at /home/hatch/workspace/.tmp/shot (playwright-core is installed there; a chromium binary is at /home/hatch/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome). Script hover, tap (mobile viewport has no hover), keyboard tab/Enter/Escape, and reduced-motion emulation, and take screenshots to inspect visually.

## Rules
- Do NOT commit or push anything. Leave the working tree as you found it (apart from any temp files, which go in /home/hatch/workspace/.tmp).
- Do NOT change any source files. This is a review pass, not a fix pass.
- Set TMPDIR=/home/hatch/workspace/.tmp for any npm/npx commands.

## Deliverable
A structured QA report: verdict (ship / ship-with-nits / needs-fixes), then findings ordered by severity, each with the file and line, what is wrong, why it matters, and the concrete fix you would apply. Keep it tight and specific, no filler.
