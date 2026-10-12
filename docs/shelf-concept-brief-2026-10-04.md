# Shelf Room — Homepage Concept Brief

## What this is
A mockup/prototype for a **redesign of my personal website**. Treat the scene described below as an **initial direction, not a final spec** — nothing is set in stone. I'm open to feedback, especially design feedback: if a choice here weakens the design, say so and propose something better. Design and iterate on the concept freely — build it as a standalone prototype (separate branch or preview file). Do NOT replace the live homepage yet; nothing here ships to production without my explicit say-so.

## Current site & hosting (so you know the setup)
- **Live site:** https://jatinmomaya.com
- **GitHub:** https://github.com/jatinmomaya/jatinmomaya.com — the `main` branch is the source of truth
- **Hosting:** Vercel, project `jatinmomaya-com`, Hobby (free) tier — auto-deploys on every push to `main`
- **Domain:** registered via Porkbun. DNS: `A @ → 216.198.79.1`, `CNAME www → <vercel-dns>.vercel-dns-017.com`
- **Current stack:** a single static page (`index.html` + `styles.css`), no build step, no framework. Deploys are just `git push`.
- If the redesign needs a framework or build step later, that's allowed (see constraints) — but the mockup phase should stay shippable and simple.

## The bigger picture — what this site is
- This is my personal site and my corner of the internet: a medium for self-expression, not a resume site or a client-facing portfolio.
- I'm committing to the **personal** register over the professional one. It should feel like me, not like a consultant's brochure.
- Uniqueness matters more than template polish. It must not look like every other portfolio site. The room-and-shelf metaphor is the differentiator — protect it.
- The site is a **living collection**, not a static page. The shelf metaphor extends to the whole thing: sections are books, the library grows over time, the room accumulates. Design for growth and for return visits, not a one-time read.
- Voice: honest, understated, opinionated. Plain human language, no AI-slop phrasing, no em dashes. The test for any copy: if anyone could have written the sentence, rewrite it.
- I'm building this partly to learn design hands-on, so design decisions should be intentional and explainable, not just decorative.

## About me (for tone and content)
- Jatin Momaya, 26. Strategy consultant in Los Angeles working on AI tools (ZS Associates, on the Amgen account — pharma/tech strategy).
- Born in India, moved to the US at 7; grew up in Houston and Southern California.
- Career arc: clinical exposure → software engineering → product → consulting. Into neuroscience, brain-computer interfaces, fantasy and sci-fi.
- Long-term pull: shaping consumer AI products end to end — from requirements through build — understanding both the business and technical sides.
- The sections, in shelf order: **Photos** (photography; gear transfer still pending, so design for a section that fills in later), **Field notes** (things I'm trying to figure out — structured as question → what I did → what I took from it; currently parked from public view because it's too exposed, but the nav slot stays and the design should welcome it back), **About** (life sketch + professional record, factual and modest, with contact details — email — inside it rather than as a separate section).

## The idea
The homepage is a cozy, illustrated room — not a page. A warm plaster wall fills the viewport. Long floating oak shelves hold books, and the books on the top shelf ARE the navigation: you only ever see their spines, like standing in front of a real bookshelf. Hovering (or tapping) a spine makes just that book turn toward you to reveal its front cover; clicking the cover goes to that section. The shelves start nearly empty on purpose — new books get added over time as new sections appear. A second, lower shelf holds books he's currently reading or recently finished — a living "now reading" shelf, not navigation.

## Register
Personal, warm, understated. This is a personal site, not a corporate portfolio. Cozy and lived-in, never whimsical or cartoonish. Think: the quiet corner of someone's apartment, rendered with care.

## The scene (desktop, full viewport)
- **Wall:** warm cream limewash plaster with subtle mottled texture, soft vignette darkening toward the edges. Light neutral, never yellow.
- **Shelves:** two long, thin, light-oak floating shelves. The top shelf sits at natural shelf height (a bit above middle of the wall) and spans most of the wall's width; a second shelf hangs below it. Soft shadows beneath each on the wall.
- **Top shelf — navigation:** three small hardcovers, realistic scale (small in frame, like viewing a real wall), left-anchored against a small dark-metal bookend so the long empty stretch to the right reads as room to grow. Spines, left to right: Photos (deep green), Field notes (kraft tan), About (navy blue). Titles set vertically on the spines, small. (About and Contact are one section — contact details live inside About.)
- **Lower shelf — now reading:** a few books he's currently reading or recently finished, grouped naturally (no bookend needed). Decorative and personal for now, not navigation — clicking one can later link out to its Goodreads page.
- **Framed prints:** two thin black portrait frames hung on the wall, grouped center-left above the shelf with generous breathing room (not crowded against it). Placeholder art for now — a muted watercolor mountain landscape and a bauhaus-style geometric print.
- **Lamp:** a tall floor lamp on the right — fabric drum shade, thin black pole, warm bulb glow pooling on the wall around and above the shade. Realistic height (shade top roughly two-thirds up the wall).
- **Floor:** medium-oak wood floor occupying only the bottom ~13% of the frame, with a slim white baseboard.
- **Name:** a small engraved brass wall plaque, top-left, reading "Jatin Momaya". No tagline, no footer, no hint text, no chrome — full immersion.
- **Responsive:** scene is full-viewport with content max-width ~1280px centered. Design it fluid for real desktop widths from the start (not tuned to one narrow frame). On mobile everything scales down; the shelf cluster stays centered and the cover reveal must never be clipped.
- **Reference:** I have a photorealistic warm render of the single-shelf version of this scene as the visual north star (cream wall, oak shelf, four spines left-grouped, two prints, tall lamp glowing right). I'll share it alongside this brief.

## The interaction
- **First load:** a one-time staggered intro — each book's cover peeks out and settles, left to right, once. This teaches visitors the books are interactive without any hint text.
- **Hover a spine:** the book lifts slightly, its spine dims, and its front cover pops toward the viewer with a subtle 3D tilt, like pulling it an inch off the shelf. 80ms hover-intent delay before opening (so sweeping the cursor doesn't machine-gun all three); closing is instant with a quick ease-out (no springy close).
- **Click:** goes to the section. Desktop: hover already revealed the cover, so a single click navigates. Touch devices (no hover): first tap reveals the cover with a small "→" cue, second tap navigates.
- **Keyboard:** tabbing to a book reveals its cover, Enter navigates, Escape closes any open cover. Focus ring styled in-world (dark bronze + soft glow, not neon blue).
- **Growth:** books are left-anchored; future books append to the right without shifting existing ones.

## Roadmap integrations (not v1, design with them in mind)
- **Goodreads:** the "now reading" shelf should eventually pull from his Goodreads — currently-reading and recently-finished books with real covers.
- **Substack:** field notes will eventually live on (or sync with) Substack — the Field notes book should deep-link there when the time comes.
- Design the shelves so real book covers and external data can slot in later without restructuring.

## Technical constraints
- This can be as complex as the design demands — no ban on frameworks, libraries, or rich media. If a distinctive interaction needs a specific tool, use it.
- The only hard priorities: it must load relatively quickly, and it must render correctly on desktop and mobile, in both landscape and portrait.
- Accessibility: real `<h1>`, `<nav aria-label>`, descriptive link labels, `aria-expanded` on touch toggle, `prefers-reduced-motion` respected (skip the intro).
- No em dashes in any visible copy. No AI-slop phrasing anywhere.
