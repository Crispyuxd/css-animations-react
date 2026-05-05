# smoothMode rollout playbook

Pilot lives in the **forms** demo (PR #1). This doc is the checklist for
extending the same motion language to the rest.

---

## TL;DR — opt a demo in

```ts
// src/app/demos/<name>/timeline.ts
export const timeline: TimelineConfig = {
  smoothMode: true,   // <- one line
  cycle: '...',
  steps: [...],
};
```

That alone enables: cursor `translate3d`, `will-change` on animated selectors,
3-decimal keyframe precision, spring polyline on cursor travel + widget show,
anticipation pulse on click targets, `[data-ring]` overlay focus rings, MetaRow
nth-child stagger, cycle-wrap fade on `.chatCard`, and the form→success morph
on `transition` steps.

The legacy path is preserved byte-for-byte for any demo without the flag.

---

## What rides along automatically

| Feature | Where | Notes |
|---|---|---|
| Cursor on translate3d | engine `cursor` branch | replaces `left`/`top` |
| `will-change: transform, opacity` | engine, every animated rule | first-frame jank gone |
| Spring polyline | engine `springLinear()` | reused on cursor travel + widget show |
| Anticipation pulse | engine `pulseData` aggregator | every cursor click `select` target gets `scale 1 → 1.012 → 1` |
| `[data-ring]` opacity tween | engine `selectionData` branch | composite-only; replaces `box-shadow` on parent |
| MetaRow nth-child stagger | engine `emitMeta` | timestamp / divider / 👍 / 👎 cascade with 70ms gap |
| Cycle-wrap fade on `.chatCard` | engine after `stackFadeCycle` | scale 0.992→1 + opacity 0.94→1 over 250ms |
| Form → success morph | engine `transition` branch | scale + counter-rotate + soft blur cross-fade |
| 3-decimal pct precision | `pct()` helper | removes ~30ms quantization snap on long cycles |

---

## Per-demo opt-ins (when you want them)

### Items that should not occupy layout until shown

```ts
{ type: 'widget', id: 'attach-1', duration: '0.25s', collapse: true }
```

Animates `max-height: 0 → 60px` and `margin-top: -16px → 0` (negative margin
consumes the parent's flex gap). Engine adds `overflow: hidden` to the selector.

Tunables: `collapseTo` (default `'60px'`), `collapseGap` (default `'16px'` —
matches FormCard gap; if your container uses a different gap, override).

### Success / confirmation cards with a shimmer pulse

```ts
{ type: 'widget', id: 'success-card', shimmer: true }
```

Component must contain a `<span data-shimmer />` overlay. See
`CaseCreatedCard.tsx` and `.module.css` for the pattern (radial green
gradient, scales 0.4→1.7 with opacity 0→1→0).

### Word-fade bot reveal (modern AI-streamed look)

Currently wired but **off** in forms (typewriter felt closer to the actual
chatbot UX). Use it where streaming-text feel is preferred:

```ts
{ type: 'bot', id: 'bot-1', mode: 'words', pause: '0.36s' }
```

```tsx
<BotMessage id="bot-1" wordMode>Hey, how can I help?</BotMessage>
```

`useTimeline` counts `[data-word]` spans at mount; engine emits one fade
keyframe per word with stagger 40ms / duration 280ms.

---

## Component prerequisites (already done — keep when adding new ones)

- **DemoCursor**: must have `top: 0; left: 0` so `transform: translate3d(x, y, 0)` lands on resolved coords (otherwise it pads from auto-resolved static position).
- **ChatCard**: must have literal `chatCard` class for the engine selector.
- **Focus targets** (FormInputRow, FormTextareaRow, AttachButton, CTAButton): each renders `<span data-ring aria-hidden />` with absolute inset. Engine tweens opacity on `#${id} [data-ring]` instead of box-shadow on parent.
- **Cards/wrappers** that get a `transition` step (state-form, state-success in forms): nothing to do — the engine emits the morph automatically.

When adding a new component that needs a focus ring or a shimmer:

1. Add `<span data-ring />` (or `<span data-shimmer />`) inside the element
2. Style: `position: absolute; inset: 0; opacity: 0; pointer-events: none`
3. Reference the `id` in the timeline (`select` waypoint or `shimmer: true`)

---

## Knobs to dial (single numbers in `timeline-engine.ts`)

| Knob | Default | Where | Effect |
|---|---|---|---|
| Spring `omega` | 8 | `springLinear(omega=8, ...)` | snappier when higher |
| Spring `zeta` | 0.62 | `springLinear(..., zeta=0.62, ...)` | reduce overshoot when raised toward 1 |
| Anticipation pulse | `scale: 1.012` | cursor branch, `pulseData` push | larger = more pronounced |
| MetaRow stagger | 70ms | `emitMeta` smooth branch | tighter = faster cascade |
| Word stagger | 40ms | bot `words` mode | applies only to word-fade |
| Word reveal duration | 0.28s | bot `words` mode | applies only to word-fade |
| Cycle wrap dip | 0.94 opacity / 0.992 scale | `chatCardWrap` keyframe | deeper = more "breath" |
| Cycle wrap window | 0.25s | `chatCardWrap` keyframe | longer = slower start/end |
| Morph hide blur | `blur(1.5px)` | transition branch | higher = more dramatic |
| Morph show blur | `blur(1px)` | transition branch | matches hide |
| Morph hide tilt | `rotate(2deg)` | transition branch | mirrored on show as -1.5deg |
| Morph midpoint | `dur * 0.55` | `morphMidPct` | lower = hide finishes earlier |
| Morph overlap window | `dur * 0.30` | `morphShowStartPct` | lower = more overlap |
| Collapse expand height | `60px` | per widget step `collapseTo` | only matters if child > 60px |

---

## Research findings (why these choices)

### linear.app
- 104 animation signatures total, but the *smooth* loops are minimal: 1.75s `Hero_pulse`, 30s `Marquee_scroll`, `IssueView_revealDots`.
- Dot grids use `steps(1)` opacity flicker — pixel-art bypasses smoothness need.
- Uniform easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (Penner easeOutQuad) on transitions; `cubic-bezier(0.66, 0, 0, 1)` reserved for the one pulse.
- 0.16s standard transition duration. Sparse `will-change`.
- No animated `left`/`top`. Anywhere.

### elevenlabs.io
- ~29 distinct animation signatures — mostly *transitions* on hover/scroll, not infinite loops.
- Uniform easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) or `cubic-bezier(0.31, 0.325, 0, 0.92)` (Vercel flat-out).
- 150 / 200 / 300 / 500ms durations — never longer.
- Specific transition properties via Tailwind utilities (`transition-opacity`, `transition-transform`); never `transition: all` on heavy props.
- No `will-change` declared. No animated `backdrop-filter`.

### Our diff before smoothMode
- Long looping mega-keyframes (15–30s cycles) vs their short transitions.
- Many things moving simultaneously vs their single-element loops.
- Cursor on `left`/`top` (layout-triggering).
- Mixed easings including overshoot bezier.
- Box-shadow animations (paint property).
- One `will-change` site-wide.

### What we adopted
- Composite-only properties (transform, opacity) for everything that animates.
- Uniform spring polyline replacing the assortment of overshoot beziers.
- Hold beats added by reordering steps and the cycle-wrap breath.
- Anticipation pulse — borrowed from Disney-12, gives "ready" feedback.
- Morph cross-fade with mirrored tilt — single-shape illusion across two elements.

### What we deliberately did not do
- Per-character stagger reveal (DOM bloat for chat content).
- Motion blur fakes (cursor blur read as muddy in testing — removed).
- Curved cursor paths (read as playful, clashes with chat-product feel).
- Variable-rate typewriter (continuous-wipe felt less smooth than the original character snap).

---

## Rollout order (suggested)

1. **escalation, slack, custom-actions** — text-heavy, no complex widgets. One-line `smoothMode: true` flip; visual diff should be subtle (better cursor, better focus, better cycle wrap).
2. **calendar, tavily, suggested-messages, button** — same flip; verify any select/deselect targets have appropriate `[data-ring]` overlays if they're new.
3. **shopify, custom-actions** — these have rich widgets (cart, picker, product sheet). Look for items that should `collapse` (anything that grows during the flow), and any "result" cards that could `shimmer`.
4. After each rollout: confirm no console errors, watch a full cycle, verify the demo's specific moments still hit their beats.

If a demo's `transition` step shouldn't morph (e.g. a simple state swap that should stay fade-only), gate it: that's a future engine flag (`step.morph?: boolean`), not in scope for the pilot.
