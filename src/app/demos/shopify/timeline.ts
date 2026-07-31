import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #shopify-scroll, gap 20 +
// UserMessage CSS margins 12/12 + MetaRow in-flow at margin-top 8,
// height 16 → adds 24 to its bot's height):
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..120  (margin 12, bubble 44 — single line)
//   bot-2 wrapper     152..~    (text 0..20 + marginTop:12 widget area below)
//
// .messages has 20px padding + overflow:hidden.
// User-message anchor at padding-box y = 20 (inset edge):
//   -76  user-1 anchor — bot-1+meta-0 scroll up together

export const timeline: TimelineConfig = {
  cycle: '27.5s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // AI bot greets — meta-0 fadeOut '0s' so it scrolls up with bot-1
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0', fadeOut: '0s' } },

    // user-1 turn-anchor (parallel): scroll runs concurrently with the
    // user bubble pop, so user-1 is anchored at the top from the first
    // frame. y: -76 lands user-1 at padding-box y=20 (the inset edge)
    // and lifts bot-1 + meta-0 above the visible viewport.
    { type: 'scroll', target: 'shopify-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', pause: '0.72s' },

    // Bot offers categories list — `lines:` mode so the engine tracks the
    // line span (#bot-2-line-1) and a later `untype` step can backspace it
    // ahead of the success transition. 46 chars at the 90 cps base ≈ 0.51s.
    { type: 'bot', id: 'bot-2', lines: [46], pause: '0.3s' },

    // Phase: categories
    { type: 'widget', id: 'categories-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-cat', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
    { type: 'cursor', id: 'cursor',
      // Enter from the right side at mid-card height — feels like the user
      // moved the mouse aside between turns, not "appeared at the top edge".
      startX: 360, startY: 320,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-mens-view', travel: '0.7s', click: '0.12s', pause: '0.4s', select: 'btn-mens-view' },
      ],
      rest: { x: 290, travel: '0.4s' },
    },

    // Transition: categories → picker
    { type: 'transition', hide: 'state-categories', show: 'state-picker', duration: '0.5s', pause: '0s' },
    { type: 'widget', id: 'picker-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-picker', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // Phase: pick first product (XY Metcon 64)
    { type: 'cursor', id: 'cursor',
      waypoints: [
        { target: 'btn-metcon', travel: '0.6s', click: '0.12s', pause: '0.3s', select: 'btn-metcon' },
      ],
      rest: { x: 280, travel: '0.4s' },
    },
    // Overlay + sheet open IN SYNC — parallel:true on the overlay keeps the
    // cursor at the same start time so the sheet widget below runs concurrent.
    // Both 0.6s with ease-scroll (no overshoot) so they read as one motion.
    { type: 'widget', id: 'sheet-overlay-1', duration: '0.6s', pause: '0s', slideY: '0px', ease: 'var(--ease-scroll)', parallel: true },
    { type: 'widget', id: 'sheet-metcon', duration: '0.6s', pause: '0.2s', slideY: '100%', ease: 'var(--ease-scroll)' },
    { type: 'cursor', id: 'cursor',
      waypoints: [
        { target: 'btn-add-metcon', travel: '0.5s', click: '0.12s', pause: '0.3s', select: 'btn-add-metcon' },
      ],
      rest: { x: 290, travel: '0.4s' },
    },
    // Close in sync: sheet slides down + overlay fades out + Select-options
    // button morphs to qty-stepper, all starting at the same time. parallel:true
    // on the first two keeps the cursor anchored so the third (overlay, no
    // parallel) drives the cursor advance.
    { type: 'transition', hide: 'sheet-metcon', show: 'noop-1', duration: '0.85s', pause: '0s', slideOutY: '100%', parallel: true },
    { type: 'transition', hide: 'btn-metcon', show: 'qty-metcon', duration: '0.3s', pause: '0s', slideOutY: '0px', parallel: true },
    { type: 'transition', hide: 'sheet-overlay-1', show: 'noop-4', duration: '0.6s', pause: '0.2s', slideOutY: '0px' },

    // Phase: pick second product (XY V2 Run)
    { type: 'cursor', id: 'cursor',
      waypoints: [
        { target: 'btn-v2run', travel: '0.6s', click: '0.12s', pause: '0.3s', select: 'btn-v2run' },
      ],
      rest: { x: 280, travel: '0.4s' },
    },
    // Overlay + v2run sheet open in sync (same as metcon).
    { type: 'widget', id: 'sheet-overlay-2', duration: '0.6s', pause: '0s', slideY: '0px', ease: 'var(--ease-scroll)', parallel: true },
    { type: 'widget', id: 'sheet-v2run', duration: '0.6s', pause: '0.2s', slideY: '100%', ease: 'var(--ease-scroll)' },
    { type: 'cursor', id: 'cursor',
      waypoints: [
        { target: 'btn-add-v2run', travel: '0.5s', click: '0.12s', pause: '0.3s', select: 'btn-add-v2run' },
      ],
      rest: { x: 290, travel: '0.4s' },
    },
    // Close in sync: sheet + overlay + button-to-qty all together.
    { type: 'transition', hide: 'sheet-v2run', show: 'noop-2', duration: '0.85s', pause: '0s', slideOutY: '100%', parallel: true },
    { type: 'transition', hide: 'btn-v2run', show: 'qty-v2run', duration: '0.3s', pause: '0s', slideOutY: '0px', parallel: true },
    { type: 'transition', hide: 'sheet-overlay-2', show: 'noop-3', duration: '0.6s', pause: '0.4s', slideOutY: '0px' },

    // Transition: picker → cart. Plain cross-fade — NOT morph: state-cart
    // is also the hide-target of the cart→success morph below, and the engine
    // emits one #state-cart { animation: ... } rule per transition; the last
    // wins, so adding a morph here would have hide-state-cart override the
    // show-state-cart, leaving state-cart opacity:1 from t=0 (visible from
    // demo start). Plain cross-fade pairs with cart-widget's own widget
    // animation to reveal the contents.
    { type: 'transition', hide: 'state-picker', show: 'state-cart', duration: '0.5s', pause: '0s' },
    { type: 'widget', id: 'cart-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-cart', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
    { type: 'cursor', id: 'cursor',
      waypoints: [
        { target: 'btn-checkout', travel: '0.7s', click: '0.12s', pause: '0.3s', select: 'btn-checkout' },
      ],
      // No `rest` — cursor fades out 0.18s after the click (engine default
      // for unparked cursor end), matching the forms demo's btn-submit beat.
      // Cursor disappears before the cart→success morph runs so the success
      // beat reads as "agent confirms order" without a stale pointer hanging.
    },

    // Cart → success — coordinated MORPH (parallel:true) running concurrent
    // with the bot-text untype→swap→type beat below, exactly like the forms
    // demo's submit→success transition. Both cards meet at scale 0.86 + blur
    // 1.5px at mid-point so it reads as one shape transforming.
    { type: 'transition', hide: 'state-cart', show: 'state-success', duration: '0.8s', morph: true, parallel: true },

    // Bot-2 backspaces during the morph — agent retracting "Here's a list…"
    // before committing to the success message. ~100 cps gives a brisk erase
    // (46 chars / 100 ≈ 0.46s), matching forms demo's bot-2 untype pacing.
    { type: 'untype', target: 'bot-2-line-1', duration: '0.45s', pause: '0.05s' },

    // Wrapper swap is purely an opacity flip — bot-3's line is still clipped
    // by its own typewriter, so the visible content arrives via the bot-3
    // step below. parallel:true keeps cursor on the typewriter's start frame.
    { type: 'transition', hide: 'state-shopify-bot', show: 'state-success-bot', duration: '0.05s', slideOutY: '0px', parallel: true },

    // Bot-3 types in the success message during the morph end. cps 120 lands
    // 43 chars in ~0.36s so text resolves around the same time the card
    // morph completes — text and card finish together as one beat.
    { type: 'bot', id: 'bot-3', lines: [43], cps: 120, pause: '0.3s' },

    { type: 'meta', id: 'meta-success', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
