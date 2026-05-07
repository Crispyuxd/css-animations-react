# Integration guide

Step-by-step for wiring `widget-demos` into your project. Pick the
section that matches your stack.

## 1. Drop the folder in

Copy the entire `widget-demos/` folder into your project. Most teams
put it at:

- Next.js: `src/widget-demos/`
- Vite / CRA: `src/widget-demos/`
- Plain TypeScript / monorepo: anywhere on your `tsconfig.json` paths

## 2. Import the token CSS — once, at your app root

The token file (`styles/tokens.css`) defines every color, shadow,
radius, and animation curve the widgets use. Without it, the widgets
will render but look unstyled.

**Next.js (App Router) — `app/layout.tsx`:**

```tsx
import '@/widget-demos/styles/tokens.css';

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

**Next.js (Pages Router) — `pages/_app.tsx`:**

```tsx
import '@/widget-demos/styles/tokens.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

**Vite — `src/main.tsx`:**

```tsx
import './widget-demos/styles/tokens.css';
```

## 3. Set up the `@/...` path alias (recommended)

The demos and components use `@/...` imports internally
(e.g. `import { ChatCard } from '@/components'`). Your project
needs a matching path alias.

### Next.js — `tsconfig.json`

The default Next.js `tsconfig.json` already maps `@/*` to `./src/*`,
which works as long as you placed `widget-demos/` inside `src/`. If
you put it elsewhere, add a more specific alias:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Vite — `vite.config.ts`

```ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Webpack — `webpack.config.js`

```js
module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};
```

If you don't want path aliases at all, you would need to rewrite the
internal `@/` imports inside `widget-demos/` to be relative. We don't
recommend this — the alias is two lines of config.

## 4. Render any demo

```tsx
import { StripeDemo } from '@/widget-demos';

export default function BillingPreview() {
  return <StripeDemo />;
}
```

The widget renders at `284 × 512 px` and runs on its own clock — no
props or state wiring needed. The animation loops indefinitely.

## 5. (Optional) Embed at a custom size

```tsx
<div style={{ transform: 'scale(1.4)', transformOrigin: 'top left' }}>
  <StripeDemo />
</div>
```

Or inline-block the demo into a card and scale the wrapper.

## 6. (Optional) Debug scrubber

Append `?debug` to any URL that renders a demo to get a fixed
play / pause / seek slider at the bottom of the screen, useful for
designers reviewing exact frames:

```
https://yourdomain.com/some-page?debug
```

The scrubber drives every CSS animation on the page via the Web
Animations API.

## 7. Updating to a newer drop

When we ship a new version:

1. Delete your existing `widget-demos/` folder.
2. Unzip the new `widget-demos-vX.Y.zip` and drop it in the same place.
3. Run your test suite. If a demo's import name has changed (rare —
   only on `MAJOR` versions), the build will fail loudly and you'll
   see it in `CHANGELOG.md`.

That's the whole upgrade story.

## Troubleshooting

**Widgets render but look unstyled / no shadows / no rounded corners**
You forgot to import `widget-demos/styles/tokens.css` at your app root.

**`Cannot find module '@/components/...'`**
Path alias isn't set up. See step 3.

**Animations don't loop / stay frozen on the first frame**
Check that `useTimeline` is being called — it's called inside each
demo's `page.tsx` and shouldn't need any wiring on your side. If you
copied only some demos, make sure you also copied `hooks/`, `lib/`,
and `components/`.

**Widget is too big / too small for my container**
Wrap it in a `<div style={{ transform: 'scale(X)' }}>` — see step 5.

**Multiple demos on the same page conflict**
They shouldn't, since each demo uses unique CSS-animation names. If
you see this, file an issue.
