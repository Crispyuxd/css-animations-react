import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #button-scroll, gap 20 +
// UserMessage CSS margins 12/12 + MetaRow in-flow at margin-top 8,
// height 16 → adds 24 to its bot's height):
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..120  (margin 12, bubble 44 — single line)
//   bot-2 botBlock    152..248  (text 152..172, slot 184..224, meta-1 232..248)
//
// .messages has 20px padding + overflow:hidden.
// User-message anchor at padding-box y = 20 (inset edge):
//   -76  user-1 anchor — bot-1+meta-0 scroll up together

export const timeline: TimelineConfig = {
  cycle: '10s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // AI bot greets — meta-0 fadeOut '0s' so it scrolls up with bot-1
    { type: 'bot', id: 'bot-1', lines: [20], cps: 45, accel: 0.9, pause: '0.36s',
      meta: { id: 'meta-0', fadeOut: '0s' } },

    // user-1 turn-anchor (parallel): scroll runs concurrently with the
    // user bubble pop, so user-1 is anchored at the top from the first
    // frame. y: -76 lands user-1 at padding-box y=20 (the inset edge)
    // and lifts bot-1 + meta-0 above the visible viewport.
    { type: 'scroll', target: 'button-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', duration: '0.4s', pause: '0.72s' },

    // Bot replies — single line typewriter
    { type: 'bot', id: 'bot-2', lines: [34], cps: 45, accel: 0.9, pause: '0.3s' },

    // CTA button slides in right after the bot text finishes
    { type: 'widget', id: 'btn-pricing', duration: '0.4s', pause: '0.3s' },

    // "Just now" timestamp fades in below the button — stays visible
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
