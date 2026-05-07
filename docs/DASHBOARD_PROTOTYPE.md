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

### Option A — npm package

Publish the widgets as an npm package (or git-URL install). The owner
runs `npm install @chatbase/widget-demos` and imports:

```ts
import { StripeDemo } from '@chatbase/widget-demos';
```

Updates ship via `npm update`. One-step, single source of truth,
versionable.

### Option B — code-files handover (zip)

Zip up the demo source files (`widget-demos-vX.Y.zip`). The owner
unzips into their repo and imports from a local path:

```ts
import { StripeDemo } from '@/widget-demos';
```

Updates ship by sending a new zip — they replace the old folder.

## What we picked: Option B (zip handover)

For our specific situation we went with Option B. Reasons:

1. **Updates are infrequent.** This is not a package we will ship every
   week. Two-three drops a year, on demand. The npm publish workflow
   would be overhead for almost no win.
2. **Small, known consumer list.** A handful of dashboards, not the open
   public. We can hand-deliver a zip and know everyone got it.
3. **No registry hosting cost or auth juggling.** No npm account,
   no GitHub Packages tokens, no private-registry plumbing.
4. **The consumer's project setup is unchanged.** They drop in a
   folder + import the token CSS. Path alias they probably already have.

The downsides we are accepting:

- No automatic version pinning per consumer. We rely on filenames
  (`widget-demos-v1.0.0.zip`) and a `CHANGELOG.md` inside the bundle.
- If a consumer tweaks files locally, our next drop will overwrite
  their edits. Tell them not to tweak inside the package folder.
- No `npm outdated` to check who's stale. If we need that, we can move
  to npm later — the import surface stays the same.

If updates become weekly or the consumer count grows, we should switch
to Option A. The barrel file (`scripts/handover-templates/index.ts`) is
already npm-shaped, so no rewrite is needed when that day comes.

## How the handover bundle is built

`scripts/build-handover.sh` regenerates `widget-demos-handover/` and
`widget-demos-vX.Y.zip` from the canonical source in `src/`. The
`widget-demos-handover/` folder is gitignored — only the zip is
checked in as a release artifact.

The zip contains:

```
widget-demos/
├── README.md             How to integrate
├── INTEGRATION.md        Detailed setup steps
├── package.json          Peer deps + entry points
├── index.ts              Public barrel — what consumers import from
├── styles/tokens.css     Design tokens (must be imported once at app root)
├── components/           All 32 widget primitives
├── hooks/useTimeline.ts  Timeline-engine hook
├── lib/                  Engine internals
└── demos/                11 ready-to-render demo components
```

Templates for the four top-level docs/manifests live at
`scripts/handover-templates/` and are copied verbatim into the bundle —
edit them there if the public surface changes.

## Why the prototype still uses an npm-shaped import

Inside this repo, `/dashboard` imports through `@chatbase/widget-demos`
(faked via a tsconfig path alias to `src/widgets-package/`). We kept
that even though we are shipping a zip, because:

- It validates that the public surface is small and self-contained
  (anything missing from `index.ts` would fail to import).
- If we ever flip to npm hosting, the prototype already shows what the
  consumer experience looks like.

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
