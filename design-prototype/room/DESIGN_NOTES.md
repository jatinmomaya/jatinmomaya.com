# Design notes

## Intent

Make the home screen feel like a small, lived-in room rather than a normal page with a room illustration behind it. Keep the wall calm and let the small set of books carry the visual focus. Leave the open shelf to the right available for future books.

## Decisions in this pass

- **Room materials:** warm plaster, medium oak, a thin pale baseboard, and a darker wood floor. The limited palette keeps the objects easy to read.
- **Grounding:** both shelves cast a small shadow; the lamp's base meets the floor line; its soft glow stays on the wall behind it.
- **Book movement:** the whole volume turns around its spine. Its flex slot widens so later books move aside instead of being covered by a swinging flap. New books can still append at the right without changing existing closed positions.
- **Art treatment:** small, quiet vector landscapes and a botanical drawing. They add a human scale without competing with the books.
- **Copy:** retain the supplied about sentence. Photos and field notes remain clearly placeholder destinations until real material is available.
- **Motion:** the staggered arrival is a short side peek and settle. Reduced-motion settings disable it. Opening uses the requested 80 ms intent delay; closing has a shorter transition.

## Review next

1. Inspect at 1440x900, 1024x768, 390x844, and 320x568, in portrait and landscape where practical.
2. Watch each book open. Check that its broad cover faces the visitor, its spine stays attached, and adjacent books make clear space without collision.
3. Check that the lamp foot actually meets the floor, the wall glow feels soft, and the shelves read as thin floating oak.
4. Check keyboard order, focus ring, Enter navigation, Escape close, touch first-tap/second-tap behavior, and reduced motion.
5. Replace destination placeholders with the real content from the website before any production integration.

## Known limitation

The in-app browser refused automated access to this local `file://` preview, so this iteration has source-level checks but no captured desktop/mobile screenshots yet. Refresh the already-open local preview to review the current files.
