import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '27s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets — typewriter, then "Just now" timestamp fades in (parallel
    // so chips can slide in alongside it instead of waiting for the full
    // hold + fadeOut cycle).
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0', parallel: true } },

    // Suggestion chips slide in just after the timestamp registers
    { type: 'widget', id: 'chips-1', duration: '0.4s', pause: '0.4s' },

    // Cursor enters and clicks "What plans do you offer?"
    { type: 'cursor', id: 'cursor-1',
      startX: 320, startY: 220,
      appear: '0.3s',
      waypoints: [
        { target: 'chip-plans', travel: '0.7s', click: '0.12s', pause: '0.5s', select: 'chip-plans' },
      ],
    },

    // Chips fade out, user message slides in. 0.72s pause before bot replies
    // matches Tavily / Custom-actions: gives the user message a beat to register.
    { type: 'transition', hide: 'chips-1', show: 'user-1', duration: '0.5s', pause: '0.72s' },

    // Bot replies — 12 visual lines at 1.26s/line (legacy 50-step typewriter,
    // exactly matches Tavily / Custom-actions / Calendar pacing). Each visual
    // line is its own span so no two ever animate in parallel.
    { type: 'bot', id: 'bot-2', lines: [20, 50, 12, 46, 25, 49, 23, 48, 17, 58, 56, 28], pause: '0.36s' },
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // Chips return so the loop reads as a fresh prompt opportunity
    { type: 'widget', id: 'chips-2', duration: '0.4s', pause: '3s' },
    { type: 'transition', hide: 'chips-2', show: 'noop-end', duration: '0.5s', slideOutY: '0px' },
  ],
};
