import type { TimelineConfig } from '@/lib/types';

// Multi-state morph chain pattern: each state is entered via a `widget` step
// (registers widgetShowTimes so the engine can later combine show+hide into a
// single keyframe) and exited via a `transition` step with parallel:true so the
// next state's `widget` runs concurrently. This yields one animation per state
// — no opacity conflicts when more than two states share the same slot.
//
// Layout offsets (in #stripe-scroll, gap=32 with marginTop:-12 on state wrapper):
//   bot-1+meta-0: 0..44
//   user-1:       76..121
//   bot-2:        153..173 (1 line, no meta)
//   state slot:   193..(card+gap+meta)   ← top = 153+20+32-12 = 193
//
// Tall cards (subs 462, picker 452) — both fit at scrollY = −147:
//   subs meta-1 bottom: 193+462+12+16 = 683 → content-box y = 536 (forms-style anchor)
//   picker meta-2 bottom: 193+452+12+16 = 673 → content-box y = 526
//   bot-2 padding-box y = 20+153−147 = 26 (just past inset minimum; tight but valid)
//
// BillSummaryCard 371 — camera pulls back to user-1 anchor (−76):
//   bill meta-3 bottom: 193+371+12+16 = 592 → padding-box y = 20+592−76 = 536 (in clip)
//   user-1 padding-box y = 20+76−76 = 20 (anchored at inset)
//
// CaseCreatedCard 121 (inside state-success with internal marginTop:12):
//   success-card top scroll-y = 193+12 = 205. At −76, padding-box y = 149.
//   Plenty of headroom; same camera as bill.

export const timeline: TimelineConfig = {
  cycle: '21.5s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // === Bot greets ===
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s', meta: { id: 'meta-0', fadeOut: '0s' } },

    // === Turn-anchor: scroll user-1 to inset edge as it pops in ===
    { type: 'scroll', target: 'stripe-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', pause: '0.24s' },

    // Subscription lookup runs behind the pending indicator.
    { type: 'thinking', id: 'trace-1' },

    // === Bot offers the subscriptions card (1 line, ~44 chars) ===
    { type: 'bot', id: 'bot-2', lines: [44], pause: '0.36s' },

    // === Camera pans deep so the tall SubscriptionsCard (462) + meta-1 fit
    //     at content-box bottom. Same scroll holds for the picker (452) so
    //     the morph between them keeps the camera steady. ===
    { type: 'scroll', target: 'stripe-scroll', y: -147, duration: '0.6s', parallel: true },
    { type: 'widget', id: 'state-subscriptions', duration: '0.55s', slideY: '12px', pause: '0.18s', ease: 'var(--ease-scroll)' },
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // === Cursor → "Update plan" → subs morphs out, picker morphs in ===
    //     Cursor lives at ChatCard level; startX/startY are in ChatCard
    //     coords (chat-card is 406×732). startY 580 places the cursor in
    //     the lower portion of the messages area as it fades in.
    { type: 'cursor', id: 'cursor-stripe',
      startX: 280, startY: 580,
      appear: '0.25s',
      waypoints: [
        { target: 'btn-update-plan', travel: '0.7s', click: '0.1s', pause: '0.1s', select: 'btn-update-plan' },
      ],
      rest: { travel: '0.25s' },
    },
    { type: 'transition', hide: 'state-subscriptions', show: 'noop-state-subs-out', duration: '0.8s', morph: true, parallel: true },
    { type: 'widget', id: 'state-planpicker', duration: '0.55s', slideY: '12px', pause: '0.18s', ease: 'var(--ease-scroll)' },
    { type: 'meta', id: 'meta-2', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // === Cursor → Standard's Select button ===
    { type: 'cursor', id: 'cursor-stripe',
      waypoints: [
        { target: 'btn-select-standard', travel: '0.6s', click: '0.1s', pause: '0.25s', select: 'btn-select-standard' },
      ],
      rest: { travel: '0.25s' },
    },

    // === Cursor → Confirm → picker morphs out, bill morphs in. Camera pulls
    //     back to user-1 anchor (-76) since the bill card is much shorter. ===
    { type: 'cursor', id: 'cursor-stripe',
      waypoints: [
        { target: 'btn-picker-confirm', travel: '0.6s', click: '0.1s', pause: '0.1s', select: 'btn-picker-confirm' },
      ],
      rest: { travel: '0.25s' },
    },
    { type: 'scroll', target: 'stripe-scroll', y: -76, duration: '0.8s', parallel: true },
    { type: 'transition', hide: 'state-planpicker', show: 'noop-state-picker-out', duration: '0.8s', morph: true, parallel: true },
    { type: 'widget', id: 'state-billsummary', duration: '0.55s', slideY: '12px', pause: '0.18s', ease: 'var(--ease-scroll)' },
    { type: 'meta', id: 'meta-3', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // === Cursor → chevron at the right end of the "Pay using" row → opens
    //     the payment-methods sheet. Targets the chevron specifically (not the
    //     whole row) so the click hotspot lines up with the affordance. ===
    { type: 'cursor', id: 'cursor-stripe',
      waypoints: [
        { target: 'pay-chevron', travel: '0.7s', click: '0.1s', pause: '0.2s', select: 'pay-row' },
      ],
      rest: { travel: '0.25s' },
    },

    // === Sheet enters + overlay fades in CONCURRENTLY. widget runs with
    //     parallel:true (no cursor advance) — the meta below owns the
    //     visible-duration timing through its fadeIn (cursor advances 0.4s),
    //     then the cursor moves to sheet-confirm during the meta's hold.
    //     hold + fadeOut sized so the overlay's quick 0.2s fadeOut runs
    //     during the LAST third of the sheet's 0.7s exit transition
    //     (T+2.0 → T+2.2): blur stays solid while drawer is sliding,
    //     then snaps clear in the final beat as the drawer settles.
    //     "Almost dismissed → blur clears" feel, ends in lockstep. ===
    { type: 'widget', id: 'payment-sheet', duration: '0.5s', slideY: '100%', parallel: true, ease: 'var(--ease-scroll)' },
    { type: 'meta', id: 'sheet-overlay', fadeIn: '0.4s', hold: '1.6s', fadeOut: '0.2s', parallel: true },

    // === Cursor → sheet's Confirm button. Cursor lives at ChatCard level
    //     (same chain as the sheet) so this waypoint resolves correctly. ===
    { type: 'cursor', id: 'cursor-stripe',
      waypoints: [
        { target: 'btn-sheet-confirm', travel: '0.55s', click: '0.1s', pause: '0.1s', select: 'btn-sheet-confirm' },
      ],
      rest: { travel: '0.25s' },
    },

    // === Sheet exits — slides DOWN (translateY 100%) + fade, mirroring the
    //     slide-UP entrance. Aligned with the meta's fadeOut. ===
    { type: 'transition', hide: 'payment-sheet', show: 'noop-sheet-out', duration: '0.7s', pause: '0.18s', slideOutY: '100%' },

    // === Cursor → bill summary's Confirm → bill morphs out, success morphs in ===
    { type: 'cursor', id: 'cursor-stripe',
      waypoints: [
        { target: 'btn-bill-confirm', travel: '0.6s', click: '0.1s', pause: '0.1s', select: 'btn-bill-confirm' },
      ],
    },
    // === Bill summary MORPHS into success card. Same pattern as forms:
    //     single transition with morph:true gives the symmetric scale-0.86
    //     + blur "meet" between the two states. parallel:true so the bot
    //     untype + cross-fade below run during the same beat. ===
    { type: 'transition', hide: 'state-billsummary', show: 'state-success', duration: '1.0s', morph: true, parallel: true },

    // === Bot-2 backspaces concurrent with the morph ===
    { type: 'untype', target: 'bot-2-line-1', duration: '0.45s', pause: '0.05s' },

    // === Bot text wrapper opacity flip (bot-3's clip-path keeps content
    //     hidden until its own typewriter runs below) ===
    { type: 'transition', hide: 'state-mgmt-bot', show: 'state-success-bot', duration: '0.05s', slideOutY: '0px', parallel: true },

    // === Shimmer pulse on the success card ===
    { type: 'shimmer', target: 'success-card', duration: '0.9s' },

    // === Bot-3 success line — fast, confident pace ===
    { type: 'bot', id: 'bot-3', lines: [22], cps: 150, accel: 0.3, pause: '0.3s' },

    // === Final timestamp ===
    { type: 'meta', id: 'meta-4', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
