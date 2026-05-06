import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #escalation-scroll, gap 20 +
// UserMessage CSS defaults of marginTop/marginBottom 12 + divider
// marginTop 24):
//   bot-1 botBlock      0..20    meta-0 abs at 28..44
//   user-1 row         52..97
//   bot-2 botBlock    129..168   meta-1 abs at 176..192
//   divider-1 (mt 24) 212..228
//   bot-3 botBlock    248..268   meta-2 abs at 276..292
//   user-2 row        299..365
//   bot-4 botBlock    397..417   meta-3 abs at 425..441
//
// .messages has 20px padding + overflow:hidden, clipping at the padding-box
// edge. Element fully hidden above viewport when:
//     offsetTop + scrollY + 20 + height ≤ 0
// Element lands at header gap G when:
//     offsetTop + scrollY + 20 = G
//
// Forms-style anchors — only fire on user-message arrivals; the divider
// arrives in its natural mid-viewport position with bot-2 + meta-1 still
// visible above as conversation context.
//   -64   user-1 anchor — bot-1 + meta-0 scroll up together; user-1 gap 8
//   -312  user-2 anchor — bot-2, meta-1, divider, bot-3, meta-2 ALL scroll
//                         up together as one block; user-2 gap 7
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
  cycle: '22s',
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
    // y: -64 puts user-1 at messages-y 8 and lifts bot-1 + meta-0 above
    // the padding-box edge.
    { type: 'scroll', target: 'escalation-scroll', y: -64, duration: '0.5s', parallel: true },
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

    // user-2 turn-anchor (parallel): y: -304 hides EVERYTHING from bot-2
    // through meta-2 — bot-2, meta-1, divider, bot-3, and meta-2 all
    // translate up together as one block — and lands user-2 at messages-y 7.
    // 0.75s duration (vs the user-1 anchor's 0.5s) because this scroll
    // covers ~240px of travel; the longer duration keeps the motion calm.
    { type: 'scroll', target: 'escalation-scroll', y: -312, duration: '0.75s', parallel: true },
    { type: 'user', id: 'user-2', duration: '0.4s', pause: '0.72s' },

    // Mark's reply — same human-agent cadence as bot-3. meta-3 holds for
    // 3.6s at the end of the cycle (matches the playbook's end-of-cycle
    // hold beat) so the final frame breathes before the loop wraps.
    { type: 'bot', id: 'bot-4', lines: [50], cps: 60, accel: 0.95, pause: '0.36s',
      meta: { id: 'meta-3', hold: '3.6s', fadeOut: '0s' } },
  ],
};
