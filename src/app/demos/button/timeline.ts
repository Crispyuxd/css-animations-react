import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '16s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets — typewriter, then "Just now" fades in/holds/fades out
    // fully before the user message appears (matches Tavily / Custom-actions).
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0' } },

    // User asks
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.72s' },

    // Bot replies — single line typewriter
    { type: 'bot', id: 'bot-2', lines: [34], pause: '0.3s' },

    // CTA button slides in right after the bot text finishes
    { type: 'widget', id: 'btn-pricing', duration: '0.4s', pause: '0.3s' },

    // "Just now" timestamp fades in below the button
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
