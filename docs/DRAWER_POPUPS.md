# Drawer pop-up rules

> Bottom-sheet / drawer overlays that slide up from the chat-card's
> bottom edge (e.g. shopify `ProductSheet`, stripe `PaymentMethodsSheet`).
> Read this before timing a new drawer or polishing an existing one.

## The five rules

1. **Entrance: `widget` with `slideY: '100%'`.** The sheet wrapper rests at
   `transform: translateY(100%); opacity: 0`; the widget keyframe drives it
   to `translateY(0); opacity: 1`. The `100%` means "the sheet's own height"
   so it always starts fully off-screen below the panel, regardless of
   sheet height.

2. **Exit: `transition` with `slideOutY: '100%'`.** Mirrors the entrance —
   slides back down to off-screen. Without `slideOutY: '100%'`, the engine
   defaults to `-6px` (a tiny upward drift), which reads as "the sheet
   dissolves" instead of "the drawer closes".

3. **Exit duration ≈ 1.4× the entrance duration.** Both phases use
   `var(--ease-scroll)` (`cubic-bezier(0.16, 1, 0.3, 1)`) — a strong decel
   curve that puts ~70% of the visual movement in the first ~30% of the
   segment time. On entrance this reads as "settling into place"; on exit
   it reads as "snap then drift". Equal durations make the close *feel*
   faster than the open. The 1.4× compensation makes them feel matched.
   - shopify: 0.6s open → 0.85s close
   - stripe:  0.5s open → 0.7s close

4. **Overlay (the dimmed/blurred backdrop) runs in parallel.** Two patterns:
   - **`widget` for both entry and exit** (shopify pattern): pair
     `widget(overlay, slideY: '0px', parallel: true)` with the sheet's
     widget; pair `transition(hide: overlay, slideOutY: '0px')` with the
     sheet's transition. Both phases under explicit cursor control.
   - **`meta` with full lifecycle in parallel** (stripe pattern):
     `meta(overlay, fadeIn, hold, fadeOut, parallel: true)` — overlay's
     own keyframe owns the fade timing; cursor advances only through
     fadeIn. Use when the overlay's hold duration drives the sheet's
     visible window.

5. **Cursor must live at chat-card level to click into the sheet.** The
   sheet is a sibling of `MessagesStack` inside `ChatCard`. If `DemoCursor`
   is mounted inside `MessagesStack` (the typical chat-pattern), its
   `offsetParent` is the messages wrapper — `offsetRelativeTo(target,
   ancestor)` cannot resolve a target inside the sheet (different
   offsetParent chains), and the cursor warning fires:
   `cursor "X" target "Y" not in same offset tree`.
   Move `<DemoCursor />` to be a direct child of `<ChatCard>` after the
   sheet so its offsetParent resolves to ChatCard, making both the
   message-stack targets and the sheet targets reachable. Scroll
   compensation in `useTimeline` handles the message-stack side.

## Reference timeline (stripe)

```ts
// 1. Cursor click that triggers the open
{ type: 'cursor', id: 'cursor-stripe',
  waypoints: [{ target: 'pay-chevron', travel: '0.7s', click: '0.1s', pause: '0.2s', select: 'pay-row' }],
  rest: { travel: '0.25s' },
},

// 2. Sheet enters, overlay full lifecycle in parallel
{ type: 'widget', id: 'payment-sheet', duration: '0.5s', slideY: '100%', parallel: true, ease: 'var(--ease-scroll)' },
{ type: 'meta', id: 'sheet-overlay', fadeIn: '0.4s', hold: '1.0s', fadeOut: '0.4s', parallel: true },

// 3. Cursor click inside the sheet (works because cursor is at ChatCard level)
{ type: 'cursor', id: 'cursor-stripe',
  waypoints: [{ target: 'btn-sheet-confirm', travel: '0.55s', click: '0.1s', pause: '0.1s', select: 'btn-sheet-confirm' }],
  rest: { travel: '0.25s' },
},

// 4. Sheet exits — same ease, 1.4× duration of entrance
{ type: 'transition', hide: 'payment-sheet', show: 'noop-sheet-out', duration: '0.7s', pause: '0.18s', slideOutY: '100%' },
```

## Anti-patterns (DO NOT introduce)

```ts
// ❌ Exit duration matches entrance — feels too fast
{ type: 'widget', id: 'sheet', duration: '0.5s', slideY: '100%' },
{ type: 'transition', hide: 'sheet', show: '_', duration: '0.5s', slideOutY: '100%' },

// ❌ Default slideOutY (−6px) — reads as "dissolve", not "close"
{ type: 'transition', hide: 'sheet', show: '_', duration: '0.7s' },

// ❌ Cursor inside MessagesStack trying to click sheet target
//    → console: "cursor X target Y not in same offset tree"
<MessagesStack>
  <div id="scroll">
    <DemoCursor id="cursor" />  // wrong location
  </div>
</MessagesStack>
<PaymentMethodsSheet id="sheet" />
```

## Quick checklist

1. Sheet wrapper CSS rests at `transform: translateY(100%); opacity: 0`.
2. Entrance: `widget` step with `slideY: '100%'` and
   `ease: 'var(--ease-scroll)'`.
3. Exit: `transition` step with `slideOutY: '100%'` and **duration ≈
   1.4× the entrance**.
4. Overlay synced via `widget` pair OR `meta` parallel-lifecycle.
5. `<DemoCursor />` placed at ChatCard level if any waypoint targets
   inside the sheet.

## Related files

- `src/components/ProductSheet/ProductSheet.module.css` — shopify sheet wrapper CSS
- `src/components/PaymentMethodsSheet/PaymentMethodsSheet.module.css` — stripe sheet wrapper CSS
- `src/lib/timeline-engine.ts` — `widget` (line ~196), `transition` `slideOutY` (line ~493)
- `src/hooks/useTimeline.ts` — `offsetRelativeTo` cursor target resolver (the offset-tree warning)
- `src/app/demos/shopify/timeline.ts` — reference implementation
- `src/app/demos/stripe/timeline.ts` — reference implementation
