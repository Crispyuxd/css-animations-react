import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '22s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.15s',
  steps: [
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0' } },
    { type: 'user', id: 'user-1', duration: '0.4s', pause: '0.72s' },
    { type: 'bot', id: 'bot-2', lines: [54, 14], pause: '0.36s',
      meta: { id: 'meta-1', hold: '1.44s', pause: '0.36s' } },
    { type: 'divider', id: 'divider-1', duration: '0.27s', pause: '0s' },
    { type: 'bot', id: 'bot-3', lines: [35], pause: '0.36s',
      meta: { id: 'meta-2', hold: '1.44s' } },
    { type: 'user', id: 'user-2', duration: '0.4s', pause: '0.72s' },
    { type: 'bot', id: 'bot-4', lines: [50], pause: '0.36s',
      meta: { id: 'meta-3', hold: '3.6s', fadeOut: '0s' } },
  ],
};
