import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #tavily-scroll, gap 20 +
// UserMessage CSS margins 12/12 + MetaRow in-flow at margin-top 8,
// height 16 → adds 24 to its bot's height):
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..142  (margin 12, bubble 66 — 2 wrapped lines)
//   trace-1           174..194  (fixed 20 row, marginBottom -12 → 8 to bot-2)
//   bot-2 botBlock    202..306  (text 202..282, meta-1 inline 290..306)
//
// .messages has 20px padding + overflow:hidden.
// User-message anchor at padding-box y = 20 (inset edge):
//   -76  user-1 anchor — bot-1+meta-0 scroll up together

export const timeline: TimelineConfig = {
  cycle: '9.5s',
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
    { type: 'scroll', target: 'tavily-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', pause: '0.24s' },

    // Web search runs behind the thinking header; the reply types out of it.
    { type: 'thinking', id: 'trace-1' },

    // Bot-2 response — 4 lines at streaming pace. meta-1 stays visible until
    // stackFadeCycle starts; end-of-cycle breathing room comes from dwell.
    { type: 'bot', id: 'bot-2', lines: [57, 56, 53, 10], pause: '0.36s',
      meta: { id: 'meta-1', hold: '0s', fadeOut: '0s' } },
  ],
};
