# Mobile-Friendliness Expert Panel — Report

**Date:** 2026-10-11
**Site:** personal website prototype, branch `design/room-prototype`
**Scope:** interactive "room" homepage (bookshelf / lamp / frames / plaque) + photobook overlay (Mexico, 19 photos)
**Method:** five specialists reviewed the code read-only (no commits). Every finding is grounded in file + line.

---

## Executive summary

Portrait phones mostly work. The prototype's mobile failures cluster in four places:

1. **Landscape phones are broken.** Both layout breakpoints are width-only, so a 740×360 phone gets the desktop two-page spread in a 317px-tall book (postage-stamp photos) and a decapitated floor lamp. Landscape is how people actually hold a phone to look at photos — this is the single worst state in the prototype.
2. **The primary mobile gesture corrupts itself.** A swipe starting on a photo fires the page-turn *and* the synthetic click opens the lightbox; a swipe from an edge arrow skips two pages. Zero `touch-action` declarations anywhere also means 300ms tap delay and double-tap-zoom fighting the lightbox.
3. **The photobook is ice-cold on 4G.** No preloading anywhere; every page turn is a 1.5–3s blank photo. The 19 photos are ~2.5× heavier than their display size justifies (7.25MB → ~2.8MB with a q65 re-encode).
4. **The overlay fails mobile assistive tech.** No focus trap, no focus return on close (focus dies on `<body>`), a nested `aria-modal` lightbox, invisible focus indicators on all overlay controls, a 2.92:1 contrast page label, and a reduced-motion specificity bug that lets the springy cover-pop play anyway.

Good news: first paint is already fast (zero webfonts, CSS-only homepage, no images), pinch-zoom is not blocked, portrait room composition survives at 360px, and `prefers-reduced-motion` is honored in JS.

---

## Per-expert findings

### 1. Mobile UX designer

| # | Sev | File:line | Finding | Fix |
|---|-----|-----------|---------|-----|
| UX-1 | **blocker** | `PhotobookOverlay.tsx:53`, `photobook.module.css:25` | Landscape phones (~740×360) get the desktop two-page spread: book is 696×317px, photos capped at ~177px tall. Postage-stamp photos. | Height-aware breakpoint: `matchMedia('(max-width: 700px), (max-height: 520px)')` + matching `@media (max-height: 520px)` CSS block mirroring the 700px rules (single page, no spine shadow). |
| UX-2 | major | `room.module.css:80` (`.lamp`), `:182-188` | Landscape phone misses the 640px breakpoint → desktop 186px lamp (~606px tall) in a ~331px scene with `overflow: hidden`. Shade clipped off; glow centered on bare pole. | `@media (max-height: 480px)`: shrink `.lamp` to ~110px, rescale `.lampGlow`, frames to ~2/3, `.shelfZone` to `bottom: 32%`. |
| UX-3 | major | `designTokens.ts:31/40/49`, `room.module.css:113` | Spine tap targets are 34–38px wide (spines 18–22px + `::after` inset −8px). This is the entire nav on mobile; near-misses open the wrong book. | Under `(hover: none)`: widen `.shelfRow` gap to 14–16px and expand `.book::after` to half the gap so effective targets reach ~44px with zero overlap. (Panel resolved the CSS-engineer's "trim to 30px" vs this "expand to 46px" disagreement in favor of expanding — 44px is the target, overlap is the thing to kill, and the way to kill it is a bigger gap, not a smaller hit area.) |
| UX-4 | major | `PhotobookOverlay.tsx:128`, `photobook.module.css:315` | The only gesture hint ("Tap the edge of a page to turn it") is `display: none` on mobile. Swipe — the primary mobile gesture — is undiscoverable. | Render a mobile hint variant ("Swipe or tap the edges to turn the page"); show it under 700px instead of hiding. |
| UX-5 | minor | `photobook.module.css:183` | Close X is 40px, placed at top-right = maximum thumb stretch on tall phones. It's also the only exit. | 44×44, safe-area-adjusted (see CSS-4), plus UX-6. |
| UX-6 | minor | `PhotobookOverlay.tsx:133-141` | "Fin" end page is a soft dead end — no action at the moment of "done". | Add "Close the book" text button on the end page → `requestClose()`. Doubles as the thumb-friendly exit UX-5 asks for. |
| UX-7 | minor | `PhotobookOverlay.tsx:103-111` | Swipe is swallowed in the lightbox (`lightbox !== null → return`); keyboard users get arrows, touch users get 44px edge strips only. | Extend `onTouchEnd` to step the lightbox index on ≥48px swipes. |

Checked and cleared: portrait room composition at 360px survives (lamp overlap reads as depth); captions/title/page-label type sizes fine; turn zones hit exactly 44px at 360px.

### 2. Responsive CSS engineer

| # | Sev | File:line | Finding | Fix |
|---|-----|-----------|---------|-----|
| CSS-1 | major | `photobook.module.css:302`, `PhotobookOverlay.tsx:53` | Same landscape hole as UX-1, plus: CSS and JS breakpoint strings are manually duplicated — they match today, fragile tomorrow. | Height-aware query in both; extract to one shared constant (see plan Phase 3). |
| CSS-2 | major | `room.module.css:176` (640px) vs `photobook.module.css:302` (700px) | 60px band where room is "desktop" and photobook is "mobile"; the grow animation crosses the breakpoint mid-flight. | Align room to 700px. |
| CSS-3 | major | `room.module.css:7` (`.room 100vh`), `:42` (`.scene 92vh`) | `vh` = large viewport on mobile browsers; room renders tall then jumps when the URL bar collapses. | `min-height: 100vh; min-height: 100dvh;` (same for 92vh). The photobook mobile rules already do this — apply the pattern everywhere. |
| CSS-4 | major | `layout.tsx` (no viewport export); `photobook.module.css:223,280,293` | No `viewport-fit=cover` → page letterboxes on notched iPhones and `env(safe-area-inset-*)` = 0. Close X sits under the Dynamic Island; page label/caption in the home-indicator zone. | `export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }`; pin edges with `max(10px, env(safe-area-inset-top))` etc. |
| CSS-5 | major | `photobook.module.css:27,128,272` | Desktop book height / photo cap / lightbox use `88vh` with no `dvh` fallback — bleed under mobile browser chrome. | Add `88dvh` fallback lines. |
| CSS-6 | minor | `photobook.module.css:126-131` | `.photo` hard-codes the book's height formula (`min(720px, 88vh) − 140px`) — desyncs the moment the book formula changes. | `.book { container-type: size; }` + `.photo { max-height: calc(100cqh - 150px); }` — one source of truth. |
| CSS-7 | minor | `room.module.css:121-135` | Cover pop is fixed 96×126px; at 320px or split-view it only just fits inside `overflow: hidden`. | `width: clamp(72px, 26vw, 96px); height: clamp(95px, 34vw, 126px);` |
| CSS-8 | minor | `photobook.module.css:18-23` | `backdrop-filter` unprefixed; full-screen blur composited behind the 0.38s grow animation = flicker risk on old iOS. | Add `-webkit-backdrop-filter`; if flicker appears, drop blur under 700px (the 0.72 scrim carries dimming alone). |
| CSS-9 | — | `room.module.css:114` | Tap-target overlap note — superseded by UX-3 resolution above (expand gap, not shrink target). | — |

Checked and cleared: no horizontal overflow at 320–360px (lampGlow contained by `overflow: hidden`); `.turn` buttons already floor at 44px; reduced-motion honored in JS.

### 3. Touch interaction specialist

Grep: **zero** occurrences of `touch-action`, `user-select`, `-webkit-tap-highlight-color`, `overscroll-behavior` in the codebase.

| # | Sev | File:line | Finding | Fix |
|---|-----|-----------|---------|-----|
| T-1 | major | `PhotobookOverlay.tsx:115-124, 180-181` | Swipe only compares touchstart/touchend X; nothing tracks touchmove or suppresses the synthetic click. Swipe starting on a photo → `next()` then `onZoom()` = **page turns AND lightbox opens**. Swipe from an edge arrow → `next()` twice = **two pages skipped**. | Track `touchmove` (>10px = swiped); `onClickCapture` on the overlay root swallows the synthetic click when swiped; `touch-action: pan-y` on `.overlay`. |
| T-2 | major | `Book.tsx:53-55, 66-89` | `touchOnly` computed once from `(hover: none)`. Touchscreen laptops (hover: true + touch) fall through both models: first tap can open the overlay with the cover never previewed; worse, `hoverRevealed` can stick `true` with no dismiss path (no mouseleave, Escape is keyboard-only, pointerdown-away only clears `openId`). | Classify per-event: `onPointerEnter={e => e.pointerType !== 'touch' && handleMouseEnter()}`; clear `hoverRevealed` in `handleClick` after activation. |
| T-3 | major | `room.module.css` (`.book`), `photobook.module.css` (all buttons) | No `touch-action: manipulation` → up to 300ms tap delay on turn arrows/photo zoom; double-tap on a photo triggers browser page-zoom, fighting tap-to-lightbox. | `touch-action: manipulation` on all interactive elements. (Do NOT use `maximum-scale=1` — a11y regression.) |
| T-4 | major (iOS) | `PhotobookOverlay.tsx:88-93` | Body scroll lock is `overflow: hidden` only; iOS rubber-bands the room behind the overlay on vertical drags. | `overscroll-behavior: none` on `html, body` and `.overlay`; `touch-action: pan-y` on overlay. |
| T-5 | minor | `photobook.module.css:326`, `PhotobookOverlay.tsx:121-122` | Swipe hint hidden on mobile (same as UX-4); lightbox swallows swipes (same as UX-7). | Mobile hint copy + extend swipe to lightbox. |
| T-6 | minor | both CSS modules | No `-webkit-tap-highlight-color` → Android gray flash on every tap against the art-directed scene. | `-webkit-tap-highlight-color: transparent` on interactive elements (`:focus-visible` outlines remain for keyboard). |
| T-7 | minor | `PhotobookOverlay.tsx:115-124` | No `onTouchCancel`; long-press on a photo raises iOS "Save to Photos" callout mid-gesture. | Add `onTouchCancel` reset; decide `-webkit-touch-callout` explicitly. |
| T-8 | minor | `room.module.css` (`.go`), `Bookshelf.tsx:73-75` | "→" cue is a 24px unlabeled circle; an imprecise second tap hits pointerdown-away and *closes* the reveal — the two-tap model punishes the imprecision it's meant to tolerate. | Explicit cue ("tap again" label or pulse); don't dismiss on the first outside pointerdown right after open, or expand the second-tap target to the whole revealed cover. |

### 4. Mobile accessibility specialist (WCAG 2.2)

| # | Sev | File:line | Finding (WCAG) | Fix |
|---|-----|-----------|----------------|-----|
| A-1 | major | `PhotobookOverlay.tsx:80-87`, `Bookshelf.tsx:116` | No focus trap; Tab walks through the scrim onto room nav behind the modal. On close, focus drops to `<body>` — VoiceOver/TalkBack users lose their place. (2.4.3) | Tab-cycler in the overlay keydown handler (wrap across close/turn/photo controls); keep a ref to the Photos anchor in Bookshelf and `.focus()` it on close. |
| A-2 | major | `PhotobookOverlay.tsx:233-243` | Lightbox is a nested `role="dialog" aria-modal="true"` inside the photobook's own modal — conflicting confinement instructions; focus never moves into the lightbox (stays on the photo button underneath). (2.4.3) | Drop `aria-modal` on the inner lightbox (outer already confines SR); move focus to lightbox close on open, return to the originating photo button on close; `aria-hidden` the `.book` container while lightbox is open. |
| A-3 | major | `room.module.css:143` vs `:172` | Reduced-motion block sets `.cover { transition: none }` at (0,1,0) specificity, but `.book.revealed .cover` is (0,3,0) — the springy `cubic-bezier(0.34, 1.35, 0.64, 1)` pop still plays for reduced-motion users. (2.3.3) | Specificity-parity rule in the reduced-motion block: `.book.revealed .cover, .book.peek .cover { transition: none; }` |
| A-4 | major | `photobook.module.css` (`.close`, `.turn`, `.photoButton`) | Zero `:focus-visible` styles on any overlay control. Focus is invisible for keyboard/BT-keyboard users. (2.4.7) | Mirror the shelf's focus treatment; light-outline variant for `.onDark`/lightbox. |
| A-5 | major | `photobook.module.css:158,198` | `#a2947f` on `#fffdf8` at 12.5px = **2.92:1** (measured) — page label (the `aria-live` orientation cue!) and hint fail 4.5:1. (1.4.3) | Darken both to `#6d6257` (5.84:1, already in palette); bump page label to 13–14px. |
| A-6 | minor | `Book.tsx:116` | The "→ go" second-tap cue is inside `aria-hidden` — AT users hear "expanded" with no hint that a second activation navigates. (4.1.2) | Visually-hidden status via `aria-describedby` when open: "Cover shown. Activate again to open." |
| A-7 | minor | `Bookshelf.tsx:91-97` | Escape calls `active.blur()` → focus dumped to document start. (2.4.3) | **Panel resolution:** the blur was added to fix a Codex-QA finding (Escape left the `:focus-visible` cover revealed). Don't drop focus to `<body>`; instead move focus to the bookshelf `<nav>` (keeps position in the list) or keep focus and suppress the stale visual via a dismissed-focus state. `aria-expanded="false"` already announces the closure. |
| A-8 | minor | `PhotobookOverlay.tsx:137`, `photobook.module.css:240` | Hint says "Tap the edge of a page" — there are no edge controls, only ‹ › buttons; and it's hidden on mobile where swipe needs explaining. (3.3.5) | Same fix as UX-4: accurate copy, shown on mobile. |

Verified pass: **pinch-zoom is NOT blocked** — no viewport meta in `layout.tsx`, so Next 15 defaults (`width=device-width, initial-scale=1`) apply. Turn buttons (44px) and the `::after` hit expansion satisfy 2.5.8.

### 5. Mobile performance engineer

Measured: all 19 photos are 1170px-wide JPEGs, 7.25MB total (worst: 06.jpg 758KB, 08.jpg 681KB, 01.jpg 526KB). Test lens: mid-tier Android, 4G ≈ 5Mbps (~0.6MB/s).

| # | Sev | File:line | Finding | Fix |
|---|-----|-----------|---------|-----|
| P-1 | major | `PhotobookOverlay.tsx:20-35, 136-161` | Only the current spread's `<img>`s are mounted; page turns unmount/mount cold. Zero preloading in `src/`. `loading="lazy"` is a no-op inside a fixed overlay (mounted = in view) and signals the wrong strategy. **Each turn = 1.5–3s blank photo on 4G; full chapter ≈ 12–20s of stall.** | `useEffect` on `[page]`: `new Image()` warm for `[page-1..page+2]`; spread `<img>` → `loading="eager"`; add a subtle loading shimmer on `.photoButton` for the residual wait. |
| P-2 | major | `Bookshelf.tsx:49-54`, `PhotobookOverlay.tsx:136` | Overlay opens on the cover (zero images); first photo needs a full 4G round trip *after* the user asks — ~2–3s to first contentful photo. | Preload photos 1–2 on earliest intent: piggyback the intro peek in Bookshelf (`revealed`/`peek` on the Photos book), or overlay mount as fallback. Cap at 2 photos. |
| P-3 | major | `public/photos/mexico/01-19.jpg` | Pixels are right (1170px), quality isn't: nothing displays at 1170 CSS px (mobile spread renders ~540px wide; lightbox is contain-fit). mozjpeg q65–70 re-encode → **7.25MB → ~2.8MB (~60% off)**, no visible change. | Re-encode all 19 at q65–70, keep 1170px. Static export disables `next/image`, so you own the pipeline: document a one-line `sharp`/`cjpeg` step for every photo added. Later: q50 ~800px spread variant via `<picture>` if the chapter grows. |
| P-4 | minor | `Bookshelf.tsx:7`, `page.tsx:1` | `PhotobookOverlay` (8.4KB) + `mexico.ts` statically imported into the homepage bundle, but only mounts after a tap. (~3–4KB gz — small, but wrong shape.) | `next/dynamic(() => import('./PhotobookOverlay'), { ssr: false })`; P-2's preload covers the dynamic-import latency. |
| P-5 | minor | `layout.tsx:2`, `ConditionalHeader.tsx:7-11` | `ConditionalHeader` statically imports `Header` then returns `null` for `/` — the only route. Dead weight parsed on every homepage load. | Delete the dead branch (or fold into P-4 cleanup). |
| P-6 | minor | `photobook.module.css:14-23, 67-74` | Full-screen `backdrop-filter: blur(6px)` animated over 0.25s = per-frame offscreen raster on Adreno-class GPUs. | Keep the blur (static = one composite); take it off the animated path — fade a non-blurred dim layer, or `will-change: opacity` only during animation. |
| P-7 | minor | `room.module.css:14-19` | `.grain` (`position: fixed; inset: 0; mix-blend-mode: multiply; z-index: 50`) forces full-viewport blending on every repaint below (hover transitions, intro peeks). Largest continuous GPU tax on the homepage. | Keep for now; if intro jank appears on low-end phones, scope it into `.scene` or bake into the wall gradient. |
| P-8 | minor | `PhotobookOverlay.tsx:26, 207-212` | No `width`/`height` on `<img>` → figure collapses then reflows per photo on 4G (jump-then-paint). | Record dimensions in `mexico.ts` (`PhotobookPhoto` += width/height) and pass through. |

Verified pass: **zero webfonts** (Georgia/system stack) — no render-blocking font chain, the best perf decision in the codebase; homepage LCP is a CSS/text element; lightbox correctly reuses the already-fetched `src` (zero extra bytes).

---

## Where the experts disagreed (resolved)

1. **Tap-target expansion (CSS-9 vs UX-3).** CSS engineer: trim `::after` to −5px to avoid neighbor overlap (~30px targets). UX designer: expand to −13px with a wider gap (~44–48px targets). **Resolved for UX-3:** 44px is the target; overlap is killed by widening the gap (14–16px under `(hover: none)`), not by shrinking the hit area. A 30px nav target on a phone is a miss factory.
2. **Escape + blur (Codex QA finding vs A-7).** The blur was added so Escape kills the lingering `:focus-visible` cover. A11y: dropping focus to `<body>` loses the user's place. **Resolved:** on Escape, move focus to the bookshelf `<nav>` (position preserved) or keep focus + add a dismissed-focus state that suppresses the stale visual. Either beats `<body>`.
3. **Backdrop blur (CSS-8 vs P-6).** Compatible: add the `-webkit-` prefix (CSS-8), keep the blur but remove it from the animated path (P-6).

---

## Agreed durable principles

1. **"Mobile" means small in either dimension.** Every width breakpoint that changes layout density gets a height/orientation companion. The photobook spread and the room scene both assume "wide = tall" — landscape phones break both. (UX, CSS)
2. **One breakpoint system, defined once, shared by CSS and JS.** The 640/700 split and the duplicated `matchMedia` string are the same bug. A shared module next to `designTokens.ts` owns the queries; CSS and JS consume it. (CSS)
3. **Classify the interaction, not the device.** Never branch touch-vs-mouse once at mount. Read `pointerType` per event; every gesture state gets an explicit exit (timeout, cancel, activation). (Touch)
4. **If you implement a gesture, own its whole lifecycle.** Hand-rolled swipe must suppress its synthetic click, declare `touch-action`, and be discoverable where it's primary. Fixed overlays must be scroll-proof on iOS (`overscroll-behavior`), not just `overflow: hidden`. (Touch)
5. **Every dialog ships a focus contract: move in, trap while open, return on close.** No `role="dialog"` without a real-phone trap test (BT keyboard, VoiceOver, TalkBack). (A11y)
6. **Animation audits are per-selector, not per-feature.** Every `transition`/`animation` needs a specificity-matched reduced-motion override. (A11y)
7. **Whatever is only in the visual layer is invisible to somebody.** State (expanded? which page? what does a second tap do?) must exist in the AT layer with real contrast. (A11y)
8. **Prefetch on intent, fetch on view — never fetch on turn.** Cover peek → warm first photos; overlay open → warm neighbors. `loading="lazy"` is for scroll pages, not fixed dialogs. (Perf)
9. **Static export means you own the asset pipeline.** Every photo gets re-encoded (q65–70, capped width) before landing in `public/photos/`, dimensions recorded in `mexico.ts`. (Perf)
10. **Dialogs are dynamic imports; the shelf is sacred.** Anything that exists only after a tap ships via `next/dynamic` and never touches first paint. (Perf)

---

## Prioritized modification plan

### Phase 0 — Quick wins (CSS/text only, ~1–2h, no behavior change)
- [ ] **P0-1. dvh fallbacks everywhere.** `room.module.css:7,42`; `photobook.module.css:27,128,272`. Add `dvh` fallback lines after every `vh` full-viewport rule. (CSS-3, CSS-5)
- [ ] **P0-2. Viewport + safe areas.** `layout.tsx`: add `export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }`. `photobook.module.css`: `.close` → `top: max(10px, env(safe-area-inset-top))`, `.pageLabel`/`.lightboxCaption` → `max(…, env(safe-area-inset-bottom))`. (CSS-4, UX-5)
- [ ] **P0-3. Contrast fix.** `photobook.module.css:158,198`: `.hint`, `.pageLabel` → `#6d6257` (5.84:1); page label to 13–14px. (A-5)
- [ ] **P0-4. Reduced-motion specificity.** `room.module.css` reduced-motion block: add `.book.revealed .cover, .book.peek .cover { transition: none; }`. (A-3)
- [ ] **P0-5. Touch CSS baseline.** Add `touch-action: manipulation` to `.book`, `.photoButton`, `.turn`, `.close`; `-webkit-tap-highlight-color: transparent` on the same; `overscroll-behavior: none` on `html, body`, `.overlay`; `-webkit-backdrop-filter` alongside `backdrop-filter` on `.scrim`. (T-3, T-4, T-6, CSS-8)
- [ ] **P0-6. Single breakpoint.** `room.module.css:176`: 640px → 700px. (CSS-2)
- [ ] **P0-7. Fluid cover.** `room.module.css:121-135`: `.cover` → `clamp(72px, 26vw, 96px)` × `clamp(95px, 34vw, 126px)`. (CSS-7)

### Phase 1 — Interaction correctness (touch + a11y, ~half day)
- [ ] **P1-1. Own the swipe lifecycle.** `PhotobookOverlay.tsx:115-124,180-181`: track `touchmove` (>10px = swiped); `onClickCapture` swallows the synthetic click after a swipe; `touch-action: pan-y` on `.overlay`; `onTouchCancel` reset. Fixes double page-turn and turn-plus-lightbox. (T-1, T-7)
- [ ] **P1-2. Hybrid pointer handling.** `Book.tsx:53-89`: replace one-shot `(hover: none)` with per-event `pointerType` checks (`onPointerEnter` skips touch); clear `hoverRevealed` on activation. Kills the stuck-cover state on touchscreen laptops. (T-2)
- [ ] **P1-3. Focus contract for the overlay.** `PhotobookOverlay.tsx`: Tab-cycler trap; move focus to lightbox close on open / return to photo button on close; drop `aria-modal` from inner lightbox + `aria-hidden` the `.book` while lightbox open; `Bookshelf.tsx`: ref on Photos anchor, `.focus()` it on close. (A-1, A-2)
- [ ] **P1-4. Focus-visible everywhere.** `photobook.module.css`: `:focus-visible` for `.close`, `.turn`, `.photoButton` (+ light variant for `.onDark`/lightbox). (A-4)
- [ ] **P1-5. Escape keeps position.** `Bookshelf.tsx:91-97`: replace `active.blur()` with focus moved to the bookshelf `<nav>` (or keep focus + dismissed-focus visual state). (A-7, resolved disagreement 2)
- [ ] **P1-6. Mobile onboarding + honest hint.** `PhotobookOverlay.tsx:128`: mobile hint copy ("Swipe or tap the edges to turn the page"), shown under 700px; extend `onTouchEnd` to step the lightbox on ≥48px swipes. (UX-4, UX-7, T-5, A-8)
- [ ] **P1-7. End-page exit.** `PhotobookOverlay.tsx:133-141`: "Close the book" button → `requestClose()`. (UX-6)
- [ ] **P1-8. AT-visible two-tap state.** `Book.tsx:116`: visually-hidden `aria-describedby` when open — "Cover shown. Activate again to open." (A-6)
- [ ] **P1-9. Bigger spine targets.** `room.module.css`: under `(hover: none)`, `.shelfRow` gap → 14–16px, `.book::after` inset → half the gap each side (≈44px effective targets, no overlap). Close X → 44×44. (UX-3, UX-5, resolved disagreement 1)
- [ ] **P1-10. Stronger "go" cue.** Make the second-tap affordance explicit (label/pulse); don't dismiss on the first outside pointerdown immediately after open. (T-8)

### Phase 2 — Performance (~half day + re-encode)
- [ ] **P2-1. Re-encode the chapter.** All 19 JPGs → mozjpeg q65–70 at 1170px. 7.25MB → ~2.8MB. Document the one-line step for future photos. (P-3)
- [ ] **P2-2. Intent preloading.** `Bookshelf.tsx`: warm photos 1–2 when the Photos book cover peeks/reveals; `PhotobookOverlay.tsx`: `useEffect` on `[page]` warms `[page-1..page+2]` via `new Image()`; spread `<img>` → `loading="eager"`; shimmer placeholder on `.photoButton`. (P-1, P-2)
- [ ] **P2-3. Intrinsic dimensions.** `mexico.ts`: add width/height per photo; pass through to `<img>`. Kills 4G reflow jump. (P-8)
- [ ] **P2-4. Dynamic import.** `Bookshelf.tsx:7` → `next/dynamic(() => import('./PhotobookOverlay'), { ssr: false })`; delete the dead `ConditionalHeader`/`Header` branch. (P-4, P-5)

### Phase 3 — Structural (landscape + architecture, ~1 day)
- [ ] **P3-1. Height-aware photobook.** Shared breakpoint module (next to `designTokens.ts`) exporting the compact query `(max-width: 700px), (max-height: 520px)`; `PhotobookOverlay.tsx:53` and `photobook.module.css:302` both consume it. Landscape phones get the single-page view. (UX-1, CSS-1)
- [ ] **P3-2. Landscape room composition.** `room.module.css`: `@media (max-height: 480px)` shrinking lamp/frames/glow and rebalancing `.shelfZone`. (UX-2)
- [ ] **P3-3. Container-query photo sizing.** `.book { container-type: size; }`, `.photo { max-height: calc(100cqh - 150px); }` — photo sizing survives all future breakpoint changes. (CSS-6)
- [ ] **P3-4. Blur off the animation path.** Animate opacity on a separate dim layer; keep static 6px blur (prefixed). Revisit `.grain` if intro jank appears on low-end devices. (P-6, P-7, CSS-8)

### Verification checklist (real devices, not emulation)
- [ ] iPhone (notched): photobook open/close, swipe both directions, lightbox swipe, vertical-drag rubber-band test, Dynamic Island/home-indicator clearance
- [ ] Mid-tier Android on 4G throttling: cold open → first photo time; page-turn stall; tap delay feel
- [ ] Landscape phone: photobook single-page, lamp intact
- [ ] Touchscreen laptop: tap books — no stuck covers, cover previews before overlay
- [ ] VoiceOver (iOS) + TalkBack: open book → browse → close → focus returns to Photos; lightbox announces as single dialog
- [ ] Bluetooth keyboard on phone: full photobook operable with visible focus
- [ ] `prefers-reduced-motion` on: no spring pops anywhere
