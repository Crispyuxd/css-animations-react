import type { TimelineConfig } from '@/lib/types';

// Layout reference (offsetTop within #calendar-scroll, gap 20 +
// UserMessage CSS margins 12/12 + MetaRow in-flow):
//   bot-1 botBlock      0..44   (text 0..20, meta-0 inline at 28..44)
//   user-1 row         76..120  (margin 12, bubble 44 — single line)
//   bot-text wrapper   152..172 (1 line = 20px)
//   card wrapper       192..~460 (calendar ~240 + meta 28)
//
// User-message anchor at padding-box y = 20 (inset edge):
//   -76   user-1 anchor
//   -152  bot-text anchor (camera pans down to focus on calendar)

export const timeline: TimelineConfig = {
  cycle: '20s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // AI bot greets — meta-0 fadeOut '0s' so it scrolls up with bot-1
    { type: 'bot', id: 'bot-1', lines: [20], cps: 45, accel: 1, pause: '0.36s',
      meta: { id: 'meta-0', fadeOut: '0s' } },

    // user-1 turn-anchor (parallel): lands user-1 at padding-box y=20
    { type: 'scroll', target: 'calendar-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', duration: '0.4s', pause: '0.72s' },

    // Bot offers calendar picker
    { type: 'bot', id: 'bot-2', lines: [37], cps: 45, accel: 1, pause: '0.3s' },

    // Calendar widget slides in — no additional scroll, user-1 stays anchored
    { type: 'widget', id: 'calendar-widget', duration: '0.4s', pause: '0.2s' },

    // meta-cal appears after calendar renders
    { type: 'meta', id: 'meta-cal', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // Cursor enters and selects day + time
    { type: 'cursor', id: 'cursor',
      startX: 250, startY: 120,
      appear: '0.3s',
      waypoints: [
        { x: 130, y: 30, travel: '0.6s', click: '0.12s', pause: '0.4s', select: 'day-26' },
        { x: 155, y: 135, travel: '0.5s', click: '0.12s', pause: '0.5s', select: 'time-330' },
      ],
    },

    // Calendar morphs into call-booked card
    { type: 'transition', hide: 'state-calendar', show: 'state-booked', duration: '1.0s', morph: true, parallel: true },

    // Bot-2 backspaces while morph is in progress
    { type: 'untype', target: 'bot-2-line-1', duration: '0.45s', pause: '0.05s' },

    // Swap bot text wrapper — opacity flip, bot-2-booked lines still
    // clipped by their own typewriter
    { type: 'transition', hide: 'state-calendar-bot', show: 'state-booked-bot', duration: '0.05s', slideOutY: '0px', parallel: true },

    // Shimmer on call-booked — green pulse coincides with morph resolve
    { type: 'shimmer', target: 'call-booked', duration: '0.9s' },

    // Bot success text types in fast
    { type: 'bot', id: 'bot-2-booked', lines: [32], cps: 150, accel: 1, pause: '0.3s' },

    // Final timestamp
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '2s', fadeOut: '0s' },
  ],
};
