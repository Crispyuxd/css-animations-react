# Chat Demo Layout Rules

> Rules for spacing inside the chat-card UI used by every demo under
> `src/app/demos/`. Read this BEFORE touching any demo's `page.tsx`,
> `timeline.ts`, or the shared `MessagesStack`/`BotMessage`/`UserMessage`/
> `MetaRow`/`ConnectedDivider` components. Violating these rules is the
> single most common source of bugs in this project.

## The three spacings (single source of truth)

| Token | Value | Where it applies |
|---|---|---|
| **inset** | 20px | Every edge of the messages area (top/left/right/bottom). Built in via `MessagesStack.module.css` `padding: 20px`. |
| **between events** | 32px | Between adjacent chat events (a bot turn, a user turn, a divider, etc.). Enforced by the inner stack's `gap` and per-element margins. |
| **internal to a turn** | 20px | Within a single chat event when it has a primary widget (e.g., bot text → its response card). Composed by adding a negative marginTop on the widget wrapper to trim the inter-event 32 down to 20. |

Anything that doesn't fit one of these three values is a bug. Don't
invent new spacings.

## Chat-card geometry

- `ChatCard` is **406 × 732** with `border-radius: 20`, `border: 1px var(--border-subtler)`.
- Three vertical regions stacked in flex column:
  - **Header** — 64px tall (`ChatHeader`).
  - **Messages** — `flex: 1`, `padding: 20px`, `overflow: hidden`.
  - **Input** — ~92px tall (`ChatInput`).
- Messages **content-box** (= padding-box height − 40 padding) is ~**536px tall**.
- `overflow: hidden` clips at the **padding-box** edge, not the content-box edge — content can be visibly translated *into* the 20px padding band before being clipped. That's why scroll math has to anchor at `padding-box y = 20` to respect the inset rule.

## Coordinate system for scroll math

Every scrollable inner stack (e.g. `#escalation-scroll`, `#forms-scroll`) sits at the **content-box top** of `.messages`.

```
padding-box y = 0   ← top edge of .messages (= bottom of header)
padding-box y = 20  ← content-box top (where #scroll's offsetTop=0 lives)
padding-box y = 556 ← content-box bottom (= 20 + 536)
padding-box y = 576 ← .messages padding-box bottom (= clip edge)
```

For an item at `offsetTop = N` inside the inner stack with the stack
translated by `scrollY`:

```
padding-box y of item top    = 20 + N + scrollY
content-box  y of item top   = N + scrollY
content-box  y of item bot   = N + height + scrollY
```

**To anchor a user message at the inset edge** (= the visible top of the
content area):
```
scrollY = -N
```

**To anchor an item's bottom at the content-box bottom** (= 20px above the chat input):
```
scrollY = 536 − (N + height)
```

If you're seeing a chat bubble visibly touch the black header bar, the
scroll math is landing it inside the top 20px inset. The fix is **not**
"move the header" or "add margin-top" — it's making `padding-box y` of
the anchored item equal **20**, not 7 or 8 or 12.

## MetaRow — THE rule (most common bug)

`MetaRow` has a `positioned` prop. **Default is `true` (absolute positioning).**

```tsx
// Default — absolute, doesn't take flex space:
<MetaRow id="meta-0" />          // position: absolute; top: 100%; margin-top: 8

// Required pattern for sequential chat flows:
<MetaRow id="meta-0" positioned={false} gap={8} />
```

When `positioned={true}`, the meta row floats below the bot text but
**doesn't take any flex space**. The next element (a user bubble, a
divider, another bot) lays out as if the meta isn't there — the result
is the meta visually overlapping whatever comes next.

In any demo with sequential turns (bot → user → bot → ...), use
`positioned={false} gap={8}`. The meta then lives in-flow inside the
bot's flex slot:

```
bot-N flex-slot height = text-height + 8 (gap above meta) + 16 (meta height)
```

`gap={8}` is required because without it the meta has no margin-top —
this is the trap that kept biting me. The `.positioned` class supplies
`margin-top: 8` only when `position: absolute`; in-flow needs the prop.

`positioned={true}` is fine for demos that have **only one bot** (or
no element below the meta), e.g. a single-message intro. Don't enable
it for anything else.

## ThinkingTrace — zero layout footprint, by design

`ThinkingTrace` is the product's trace-off pending indicator: the spinning mark
plus a shimmering "Thinking". In the widget it **replaces** the reply rather
than sitting above it (it is what the old typing dots became), and it unmounts
the moment the message arrives.

So it is **absolutely positioned over its bot message's first line** and takes
no layout space at all. **No offset below it moves. No scroll anchor changes.**
Pass it through `BotMessage`'s `trace` slot, never as a stack child:

```tsx
<BotMessage id="bot-2" trace={<ThinkingTrace id="trace-1" />} lines={[...]} />
```

`.botBlock` is already `position: relative`, so the indicator anchors to the
message. Its `font-size` / `line-height` match `.msg` (14px / 1.4) so it sits
exactly where the reply's first line types in.

Two rules:

1. **Put it on the message that types out of the wait**, i.e. the first reply
   (`bot-2`). Not on a greeting, and not on a human agent's message
   (escalation's Mark Kent).
2. **Never leave it visible past the cut.** The `thinking` step ends with a hard
   1ms opacity cut timed to the frame the reply starts typing, matching the
   widget's unmount. Indicator and reply are never both on screen.

## Computing layout offsets

For a typical bot-1 → user-1 → bot-2 → divider → bot-3 → user-2 → bot-4
sequence with `gap: 20` on the stack and `.userRow` margin 12/12:

| Item | Slot top | Visible top | Visible bot | Slot bot |
|---|---|---|---|---|
| bot-1 (text 20 + meta 24) | 0 | 0 | 44 | 44 |
| user-1 (margin 12, bubble 44) | 64 | 76 | 120 | 132 |
| bot-2 (text 40 + meta 24) | 152 | 152 | 216 | 216 |
| divider (margin 12, line 16) | 236 | 248 | 264 | 276 |
| bot-3 (text 20 + meta 24) | 296 | 296 | 340 | 340 |
| user-2 (margin 12, bubble 66) | 360 | 372 | 438 | 450 |
| bot-4 (text 40 + meta 24) | 470 | 470 | 514 | 514 |

Visible inter-event gap = 32 between every adjacent pair.

Scroll anchor for user-1 at inset (= padding-box y=20): `scrollY = -76`.
Scroll anchor for user-2 at inset: `scrollY = -372`.

(See `src/app/demos/escalation/timeline.ts` for the canonical example.)

## When a widget is too tall to fit (forms demo)

Some demos have a widget (form card, picker, calendar) taller than the
536px content area. Solution: **scroll the top out of view, anchor the
bottom of the lowest visible element at the content-box bottom edge**.

For `forms`:
- form-card top in `#forms-scroll` = 193, base height = 438, expanded height = 510.
- meta-1 sits 12px + 16px = 28px below form-card.
- **Pre-attach scroll** (form base 438) — anchor meta-1 bottom: `scrollY = 536 − (193 + 438 + 12 + 16) = -123`.
- **Deep scroll** (form expanded 510, after attach click) — anchor meta-1 bottom: `scrollY = 536 − (193 + 510 + 12 + 16) = -195`.

The `−72` scroll delta is intentional — it exactly matches the form's
72px height growth (two attachments × 36px each). Meta-1 stays at the
content-box bottom edge throughout the expansion animation.

If the user complains "the card is getting clipped during typing" or
"the meta is being cut off," it's almost always one of:

1. The pre-widget scroll is anchoring user-1 at the inset (e.g. -76)
   when it should anchor the widget's bottom (-95, -123, or similar
   depending on the widget).
2. The deep scroll value isn't accounting for the expanded widget
   height.
3. `MetaRow` is still `positioned={true}` and overlapping the widget
   wrapper below it.

## Anti-patterns (DO NOT introduce)

These all existed in the codebase before the inset/gap rule was
enforced. Don't re-introduce them — use the rule instead.

```tsx
// ❌ Compensating for absolute meta with marginTop on the next item
<ConnectedDivider style={{ marginTop: 24 }} />

// ❌ Tightening the stack to fit a card, then patching gaps
<div style={{ gap: 10 }}>
  <UserMessage style={{ marginTop: 26, marginBottom: 0 }} />
  <Wrapper style={{ marginTop: -2 }}>...</Wrapper>
</div>

// ❌ Anchoring user messages inside the inset
{ type: 'scroll', y: -64 },  // lands user-1 at messages-y 8
```

```tsx
// ✅ Layout enforces 32 between events
<div style={{ gap: 32 }}>
  <BotMessage meta={<MetaRow positioned={false} gap={8} />} />
  <UserMessage style={{ marginTop: 0, marginBottom: 0 }}>...</UserMessage>
  <div style={{ marginTop: -12 }}>{/* widget — internal 20 from previous */}</div>
</div>

// ✅ Scroll anchors at the inset edge
{ type: 'scroll', y: -76 },   // lands user-1 at padding-box y=20
```

## Quick checklist before committing a demo

1. Every `<MetaRow>` in a sequential-turn flow has `positioned={false} gap={8}`.
2. Inner stack `gap` is **32** OR the stack uses `gap: 20` with deliberate
   `margin-top: 12; margin-bottom: 12` on `UserMessage` (legacy pattern,
   sums to 32 around user bubbles only — be careful).
3. Every `scroll` step's `y` value lands its target at `padding-box y >= 20`.
   Compute by hand: `padding-box y = 20 + offsetTop + y`. If the result
   is < 20, the inset is being violated.
4. For a long widget, the deep scroll anchors the bottom of the lowest
   visible element at content-box y = 536.
5. The 32-between rule is observed between every pair of adjacent flex
   children. Internal-to-turn spacing (bot text → its widget) is 20.

## Related files

- `src/components/MessagesStack/MessagesStack.module.css` — the 20 inset
- `src/components/MetaRow/MetaRow.tsx` — the `positioned` prop
- `src/components/UserMessage/UserMessage.module.css` — the 12/12 margins
- `src/app/demos/escalation/page.tsx` + `timeline.ts` — canonical example
- `src/app/demos/forms/page.tsx` + `timeline.ts` — long-widget pattern
