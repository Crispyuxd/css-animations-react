# Dashboard prototype — notes

We built a small prototype at `/dashboard` to test how our animated widgets
will be shipped to a real owner's dashboard. The point was not to build a
real dashboard — it was to make sure that whichever way we hand the widgets
over, nothing breaks on the receiving end.

## What the prototype shows

Three states from Figma `Dashboard V3`, wired up as a single page:

1. **Templates** (Figma `1327:9765`) — full Chatbase dashboard, Templates
   tab. Backdrop is a 2× PNG export of the Figma frame.
2. **Connect Stripe** (Figma `1327:10057`) — modal overlay. Live
   `<StripeDemo />` on the left, "Connect now" CTA on the right.
3. **Available actions** (Figma `1327:10160`) — modal overlay. Same live
   `<StripeDemo />` on the left, four-item Stripe action list on the right.

Click flow: click the Templates grid → Connect modal → "Connect now" →
Available actions → close X → back to Templates.

Only the **Stripe** demo is wired in. Leads is exported from the package
barrel but not used here.

## How we ship the widgets — two options we considered

### Option A — npm package (the one we chose, simulated)

Publish the widgets as an npm package (e.g., `@chatbase/widget-demos`).
The owner runs `npm install @chatbase/widget-demos` and imports them:

```ts
import { StripeDemo } from '@chatbase/widget-demos';
```

We did not actually publish to npm yet. Instead, we **faked** the package
locally:

- `src/widgets-package/index.ts` is a tiny barrel file that re-exports
  `StripeDemo` and `LeadsDemo` from the existing `src/app/demos/*` source.
- `tsconfig.json` adds a path alias so `@chatbase/widget-demos` resolves
  to that local barrel.

The dashboard then imports exactly like a real npm consumer would. When we
do publish, the import line in the consumer's code does not change.

### Option B — copy-paste the code files

Hand the owner a zip of our demo source files. They paste them into their
repo and import from local paths.

## Why we picked the npm option

In simple words:

1. **Updates are one-step.** We publish a new version → they run
   `npm update`. That's it. No re-handover, no copy-paste, no merge
   conflicts.

2. **One source of truth.** The widget code lives in our repo only.
   Bugs we fix here go out to every consumer the next time they update.
   With copy-paste, the moment they paste the files, they own a frozen
   copy that drifts away from ours.

3. **Versioning.** They can pin to a specific version (e.g.
   `^1.2.0`) and choose when to upgrade. Copy-paste has no version concept
   — they would have to track manually which "drop" they're on.

4. **Smaller, cleaner public API.** The barrel file is a literal list of
   what we export. Anything not listed there is not reachable from the
   package. Copy-paste exposes the entire folder structure, including
   internals we did not mean to expose.

5. **The prototype already proved it works.** Importing through the
   simulated package surface caught any hidden dependency issues here,
   in our repo, before publishing — instead of after.

## Why we did not pick the copy-paste option

It is fine for a one-time demo, but breaks down the moment we need to
ship a fix or a new demo:

- We would have to re-send the files to every owner manually.
- Each owner would have to re-paste, possibly resolving merge conflicts
  with their own edits.
- Easy for an owner to silently keep an old, buggy version forever.
- Two divergent codebases over time — a maintenance nightmare.

## What the prototype validates

- The package surface (what we export from the barrel) is enough for a
  real consumer dashboard.
- The widget renders at the same size when imported as it does in our
  own demo pages — `284 × 512` (the `0.7×` scale is baked into
  `ChatCard`, so every consumer gets the same render).
- Modal overlays sit on top of a real dashboard chrome correctly.

## What the prototype does **not** cover (intentional)

- The dashboard chrome is a static PNG, not real React. Sidebar, search,
  tabs, individual cards are not interactive.
- Routing is a single in-component state machine, not URL-based deep
  links.
- Only the Stripe widget is wired in; Leads is exported but not used.

These are out of scope — this is a shipping-method test, not a real
dashboard build.
