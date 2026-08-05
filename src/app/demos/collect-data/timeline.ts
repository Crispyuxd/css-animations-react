import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #collect-data-scroll, gap 20 +
// UserMessage CSS margins 12/12 + MetaRow in-flow at margin-top 8,
// height 16 → adds 24 to its bot's height). Verified against the rendered
// DOM, not derived on paper — #collect-data-scroll measures 388 tall:
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..121  (margin 12, bubble 45 — single line, hugs text)
//   bot-2 botBlock    153..216  (text 153..192, meta-1 inline 200..216)
//   user-2 row        248..293  (margin 12, bubble 45 — single line)
//   bot-3 botBlock    325..388  (text 325..364, meta-2 inline 372..388)
//
// Visible inter-event gap = 32 between every adjacent pair.
//
// .messages has 20px padding + overflow:hidden. Element lands at
// padding-box y G when:  offsetTop + 20 + scrollY = G
//
// User-message anchors land at padding-box y = 20 (= flush with the
// content-box top, respecting the 20px inset rule):
//   -76   user-1 anchor — bot-1 + meta-0 scroll up together
//   -248  user-2 anchor — bot-2 + meta-1 scroll up as one block
//
// Same two-anchor camera as escalation: every user turn gets anchored at the
// inset edge. Both anchors run 0.5s — one camera move, one duration, so every
// user turn arrives the same way. (escalation stretches its second anchor to
// 0.75s, but that one covers 296px; at 172px here the longer duration just
// reads as a slower camera for no reason. --ease-scroll's heavy decel keeps
// 172px in 0.5s calm.)
//
// All metas use fadeOut '0s' so each timestamp + thumbs row stays at
// opacity 1 and translates up alongside its bot block during the next
// anchor scroll instead of fading out first.
//
// Bot voice: engine defaults (90 cps, accel +0.45) on all three. Every
// message here is the AI agent — there's no human-agent voice in this flow,
// so nothing overrides cps/accel.
//
// Line splits: bot text wraps at the FULL 366 stack width — `.botMsg`'s
// padding-right: 32 does not apply to the multi-line <p>, so the budget is 366,
// not 334 (334 is the *user* bubble's, which sits in .userRow's 32px inset).
// Each line 1 is filled to just under 366 the way the browser would break it
// (bot-2 341.2, bot-3 328.8), matching the house fill-line-1 pattern —
// custom-actions ships 363.1. Splitting shorter makes the block read as a
// narrower column than the message above it. Measured, not estimated: a line
// that overflows wraps inside its clip-path and breaks the typewriter reveal.

export const timeline: TimelineConfig = {
  // 14.5s, not 13s: the settled final frame (both values captured + the
  // confirmation + its timestamp) holds ~2.95s before stackFadeCycle starts the
  // outro, so the payoff is readable instead of being taken the moment it
  // lands. That's about double the 1.02–1.58s dwell the other demos run — a
  // deliberate outlier, like transfer-to-human's. Re-check with
  // `npx tsx scripts/audit-cycle-timing.ts` after any timing change.
  cycle: '14.5s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // AI bot greets — 20 chars at streaming pace. meta-0 fadeOut '0s' so it
    // scrolls up *with* bot-1 at the user-1 anchor.
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0', fadeOut: '0s' } },

    // user-1 turn-anchor (parallel): scroll runs concurrently with the user
    // bubble pop, so user-1 is anchored at the top from the first frame.
    // y: -76 lands user-1 at padding-box y=20 (the inset edge) and lifts
    // bot-1 + meta-0 above the visible viewport.
    { type: 'scroll', target: 'collect-data-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', pause: '0.24s' },

    // The action runs behind the pending indicator.
    { type: 'thinking', id: 'trace-1' },

    // The agent asks for the fields it was configured to collect — 2 lines at
    // the same streaming pace as bot-1. meta-1 holds 1.44s: that hold is the
    // beat where the customer reads the question before answering it.
    { type: 'bot', id: 'bot-2', lines: [52, 19], pause: '0.36s',
      meta: { id: 'meta-1', hold: '1.44s', fadeOut: '0s' } },

    // user-2 turn-anchor (parallel). EVERY user message pins to the top — it's
    // the house scroll-pin rule for these flows, not a per-demo judgement call,
    // so it applies even though the exchange would have fit unscrolled. y: -248
    // lifts bot-2 + meta-1 out of view as one block and lands user-2 at
    // padding-box y=20. The customer gives both values in one message — the
    // payoff of a no-form collector.
    { type: 'scroll', target: 'collect-data-scroll', y: -248, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-2', pause: '0.72s' },

    // Confirmation that both values were captured. meta-2 has no hold
    // (fadeOut '0s' makes hold a no-op anyway); the end-of-cycle breathing
    // room is the ~2.95s dwell before stackFadeCycle starts the outro.
    { type: 'bot', id: 'bot-3', lines: [53, 23], pause: '0.36s',
      meta: { id: 'meta-2', hold: '0s', fadeOut: '0s' } },
  ],
};
