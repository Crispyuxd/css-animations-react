import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '13s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0' } },
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.72s' },
    { type: 'bot', id: 'bot-2', lines: [52, 52, 27], pause: '0.36s',
      meta: { id: 'meta-1', hold: '3.6s', fadeOut: '0s' } },
  ],
};
