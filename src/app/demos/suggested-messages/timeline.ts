import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #suggested-scroll, gap 20 +
// UserMessage CSS margins 12/12 + MetaRow in-flow at margin-top 8,
// height 16 → adds 24 to its bot's height):
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..120  (margin 12, bubble 44 — single line)
//   bot-2 botBlock    152..416  (text 152..392, meta-1 inline 400..416)
//
// .messages has 20px padding + overflow:hidden.
// User-message anchor at padding-box y = 20 (inset edge):
//   -76  user-1 anchor — bot-1+meta-0 scroll up together

export const timeline: TimelineConfig = {
  cycle: '24s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // AI bot greets — meta-0 fadeOut '0s' so it scrolls up with bot-1
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0', fadeOut: '0s', parallel: true } },

    // Suggestion chips slide in just after the timestamp registers
    { type: 'widget', id: 'chips-1', duration: '0.4s', pause: '0.4s' },

    // Cursor enters and clicks "What plans do you offer?"
    { type: 'cursor', id: 'cursor-1',
      startX: 320, startY: 220,
      appear: '0.3s',
      waypoints: [
        { target: 'chip-plans', travel: '0.7s', click: '0.12s', pause: '0.5s', select: 'chip-plans', hover: '0.3s' },
      ],
    },

    // Chips fade out, user message slides in — scroll runs concurrently
    // to anchor user-1 at the inset edge (padding-box y=20).
    { type: 'scroll', target: 'suggested-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'transition', hide: 'chips-1', show: 'user-1', duration: '0.5s', pause: '0.72s' },

    // Bot replies — 12 lines at streaming pace. meta-1 stays visible.
    // Local accel override: the product's +45%/line is tuned for 2-4 line
    // replies. Over 12 lines it compounds to ~535 cps by the last line, which
    // reads as a flash, not a reveal. 0.1 keeps the accelerating feel and tops
    // out at 189 cps. Any reply this long needs its own accel.
    { type: 'bot', id: 'bot-2', lines: [20, 50, 12, 46, 25, 49, 23, 48, 17, 58, 56, 28], accel: 0.1, pause: '0.36s' },
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // Chips return so the loop reads as a fresh prompt opportunity. Pause
    // is sized so the fade-out lands inside the messagesStack outro window
    // (cycleMs − outroFade − 0.9s … cycleMs − 0.9s) and the duration matches
    // outroFade so chips and messages fade in lockstep.
    { type: 'widget', id: 'chips-2', duration: '0.4s', pause: '5.84s' },
    { type: 'transition', hide: 'chips-2', show: 'noop-end', duration: '0.9s', slideOutY: '0px' },
  ],
};
