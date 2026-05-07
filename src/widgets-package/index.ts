// Public API of the (future) @chatbase/widget-demos package.
//
// External consumers MUST also import the package's token CSS once at the
// app root (e.g. _app.tsx or layout.tsx):
//
//   import '@chatbase/widget-demos/styles.css';
//
// In this monorepo prototype the tokens come for free because the root
// layout already imports `src/app/globals.css`. Real consumers won't get
// them automatically — that's the one contract they need to honor.

export { default as StripeDemo } from '@/app/demos/stripe/page';
export { default as LeadsDemo } from '@/app/demos/leads/page';
