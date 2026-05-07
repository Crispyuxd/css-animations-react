# widget-demos

Animated chat-widget demos as drop-in React components. Each demo is a
short, looping animation showing a specific agent flow (Stripe billing,
Shopify cart, calendar booking, lead capture, etc.).

## What's in the box

```
widget-demos/
├── index.ts                  Public API — import demos from here
├── package.json              Peer deps + entry points
├── styles/
│   └── tokens.css            Design tokens (colors, easings, shadows).
│                             MUST be imported once at your app root.
├── components/               All 32 widget primitives (ChatCard,
│                             ChatHeader, MessagesStack, etc.)
├── hooks/
│   └── useTimeline.ts        Drives the per-demo timeline engine
├── lib/                      Timeline engine internals
└── demos/                    11 ready-to-render demo components
    ├── stripe/
    ├── leads/
    ├── shopify/
    ├── slack/
    ├── tavily/
    ├── escalation/
    ├── calendar/
    ├── custom-actions/
    ├── forms/
    ├── button/
    └── suggested-messages/
```

## Quick start

1. Copy the entire `widget-demos/` folder into your project (e.g. into
   `src/widget-demos/`).
2. Import the token CSS once in your app entry (e.g. `app/layout.tsx`,
   `_app.tsx`, or wherever you import global styles):

   ```tsx
   import 'src/widget-demos/styles/tokens.css';
   ```

3. Render any demo:

   ```tsx
   import { StripeDemo } from 'src/widget-demos';

   export default function MyPage() {
     return <StripeDemo />;
   }
   ```

That's it. Every demo runs autonomously — no props, no state wiring needed.

## Available demos

| Component               | What it shows                                           |
|-------------------------|---------------------------------------------------------|
| `StripeDemo`            | Subscription management & billing flow                  |
| `LeadsDemo`             | Lead capture form with inline validation                |
| `ShopifyDemo`           | Product browsing, cart, checkout                        |
| `SlackDemo`             | Multi-line bot reply with meta row                      |
| `TavilyDemo`            | Web search → answer with citations                      |
| `EscalationDemo`        | Hand-off from agent to human support                    |
| `CalendarDemo`          | Time-slot picker → call-booked confirmation             |
| `CustomActionsDemo`     | Custom action invocation pattern                        |
| `FormsDemo`             | Multi-field form → success morph                        |
| `ButtonDemo`            | CTA button with click animation                         |
| `SuggestedMessagesDemo` | Suggestion chips → user selection                       |

## Requirements

- **React** ≥ 18
- **React DOM** ≥ 18
- Native CSS animations + `linear()` easing — works in all evergreen
  browsers. No Framer Motion / GSAP runtime needed.
- TypeScript ≥ 5 if you import from `.ts` directly (most consumers will).

## Integration details

See `INTEGRATION.md` for:
- Path-alias setup (Next.js, Vite, Webpack)
- Embedding demos at custom sizes
- Disabling autoplay
- Debug scrubber (`?debug` URL param)
- Updating to a newer drop

## Sizing & scale

Every demo renders inside a `ChatCard` that is hard-coded at `0.7×`
scale, so the visible widget is **284 × 512 px** in any consumer
environment. If you need a different size, wrap the demo in a `<div>`
with a CSS `transform: scale(...)`.

## Updates

This bundle is delivered as a zip on release. When we ship a new drop:

1. We will send you a fresh `widget-demos-vX.Y.zip`.
2. Replace your existing `widget-demos/` folder with the new contents.
3. No import lines should change — all public APIs stay stable.

Versions follow semver (`MAJOR.MINOR.PATCH`). Breaking changes only
happen on `MAJOR` bumps and will be called out in a `CHANGELOG.md`.

## Support

Issues, requests, custom demos: contact the SupaStellar team.
