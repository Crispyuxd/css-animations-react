import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #escalation-scroll, gap 20 +
// UserMessage CSS margins 12/12 + divider margins 12/12 + MetaRow
// in-flow at margin-top 8, height 16 → adds 24 to its bot's height):
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..120
//   bot-2 botBlock    152..216  (text 152..192, meta-1 inline 200..216)
//   divider-1         248..264
//   bot-3 botBlock    296..340  (text 296..316, meta-2 inline 324..340)
//   user-2 row        372..438
//   bot-4 botBlock    470..514  (text 470..490, meta-3 inline 498..514)
//
// .messages has 20px padding + overflow:hidden. Element lands at
// padding-box y G when:  offsetTop + 20 + scrollY = G
//
// User-message anchors land at padding-box y = 20 (= flush with the
// content-box top, respecting the 20px inset rule):
//   -76   user-1 anchor — bot-1+meta-0 scroll up together
//   -372  user-2 anchor — everything from bot-2 through meta-2 scrolls
//                         up as one block
//
// All metas use fadeOut '0s' so each timestamp + thumbs row stays at
// opacity 1 and translates up alongside its bot block during the next
// anchor scroll instead of fading out first. Reads as a single cohesive
// turn-block sliding out of view (matches forms-demo behavior).
//
// Bot voices (per the playbook recipe):
//   AI assistant   — cps 45, accel 0.9   (streamed-token decay, "thinking pace")
//   Mark Kent      — cps 60, accel 0.95  (human keyboard rhythm, almost-flat decay)

export const timeline: TimelineConfig = {
  cycle: '17.5s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // AI bot greets — 20 chars at streaming pace. meta-0 fadeOut '0s' so
    // it scrolls up *with* bot-1 at the user-1 anchor.
    { type: 'bot', id: 'bot-1', lines: [20], cps: 45, accel: 0.9, pause: '0.36s',
      meta: { id: 'meta-0', fadeOut: '0s' } },

    // user-1 turn-anchor (parallel): scroll runs concurrently with the user
    // bubble pop, so user-1 is anchored at the top from the first frame.
    // y: -76 lands user-1 at padding-box y=20 (the inset edge) and lifts
    // bot-1 + meta-0 above the visible viewport.
    { type: 'scroll', target: 'escalation-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', duration: '0.4s', pause: '0.72s' },

    // AI bot offers escalation — 2 lines at the same streaming pace as
    // bot-1 to keep the assistant voice consistent. meta-1 fadeOut '0s'.
    { type: 'bot', id: 'bot-2', lines: [54, 14], cps: 45, accel: 0.9, pause: '0.36s',
      meta: { id: 'meta-1', hold: '1.44s', fadeOut: '0s' } },

    // Divider arrives WITHOUT a scroll — fades in below bot-2 + meta-1 in
    // its natural layout position (~messages-y 160 at the user-1 anchor).
    // Reads as "Mark Kent joined" appearing mid-conversation rather than
    // as a hard section break.
    { type: 'divider', id: 'divider-1', duration: '0.27s', pause: '0.36s' },

    // Mark Kent's first message — human-agent recipe (cps 60, accel 0.95)
    // so the keyboard rhythm reads distinct from the AI bot's streaming.
    // meta-2 fadeOut '0s' so it scrolls up with bot-3 at the user-2 anchor.
    { type: 'bot', id: 'bot-3', lines: [35], cps: 60, accel: 0.95, pause: '0.36s',
      meta: { id: 'meta-2', hold: '1.44s', fadeOut: '0s' } },

    // user-2 turn-anchor (parallel): y: -372 hides EVERYTHING from bot-2
    // through meta-2 — bot-2, meta-1, divider, bot-3, and meta-2 all
    // translate up together as one block — and lands user-2 at padding-box
    // y=20 (the inset edge). 0.75s duration (vs the user-1 anchor's 0.5s)
    // because this scroll covers ~296px of travel; the longer duration
    // keeps the motion calm.
    { type: 'scroll', target: 'escalation-scroll', y: -372, duration: '0.75s', parallel: true },
    { type: 'user', id: 'user-2', duration: '0.4s', pause: '0.72s' },

    // Mark's reply — same human-agent cadence as bot-3. meta-3 has no hold
    // (fadeOut:0 makes hold a no-op anyway); the end-of-cycle breathing room
    // is the dwell gap before stackFadeCycle starts the outro.
    { type: 'bot', id: 'bot-4', lines: [50], cps: 60, accel: 0.95, pause: '0.36s',
      meta: { id: 'meta-3', hold: '0s', fadeOut: '0s' } },
  ],
};
