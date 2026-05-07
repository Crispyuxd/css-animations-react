<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Chat layout rules — READ BEFORE EDITING ANY DEMO

`docs/CHAT_LAYOUT.md` is the single source of truth for spacing inside every chat-card demo (`src/app/demos/*/page.tsx` + `timeline.ts`). It documents:

- The three spacings (20 inset, 32 between events, 20 internal-to-turn).
- The `MetaRow` `positioned={false} gap={8}` rule — the most common source of bugs.
- Coordinate math for scroll anchors (how to land a user message at the inset edge).
- The "anchor the bottom of the lowest visible element" pattern for tall widgets (forms demo).

If a user reports "spacing looks off" or "bubble too close to header" or "card border getting clipped," start by reading `docs/CHAT_LAYOUT.md`. Don't reinvent the rules.

# Drawer pop-up rules — READ BEFORE TIMING A SHEET

`docs/DRAWER_POPUPS.md` is the single source of truth for bottom-sheet
behavior (shopify `ProductSheet`, stripe `PaymentMethodsSheet`). It
documents:

- `slideY: '100%'` entrance + `slideOutY: '100%'` exit (drawer slide vs default −6px dissolve).
- Exit duration ≈ 1.4× entrance to compensate for `var(--ease-scroll)` decel-curve perceived-speed asymmetry.
- Overlay sync patterns (widget pair vs meta parallel-lifecycle).
- Why `<DemoCursor />` must live at ChatCard level when any waypoint targets a button inside the sheet.

If a user reports "close feels faster than open" or "cursor can't click into the sheet" or "sheet just fades, doesn't slide," start by reading `docs/DRAWER_POPUPS.md`.
