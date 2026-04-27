import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '16s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    { type: 'bot', id: 'bot-1', duration: '1.26s', pause: '0.36s',
      meta: { id: 'meta-0' } },
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.72s' },
    { type: 'bot', id: 'bot-2', duration: '1.26s', pause: '0.3s' },
    { type: 'widget', id: 'calendar-widget', duration: '0.4s', pause: '0.6s' },
    { type: 'cursor', id: 'cursor',
      startX: 250, startY: 120,
      appear: '0.3s',
      waypoints: [
        { x: 100, y: 30, travel: '0.6s', click: '0.12s', pause: '0.4s', select: 'day-26' },
        { x: 155, y: 135, travel: '0.5s', click: '0.12s', pause: '0.5s', select: 'time-330' },
      ],
    },
    // Cross-fade the entire state containers (parent divs that include bot text + widget/card)
    { type: 'transition', hide: 'state-calendar', show: 'state-booked', duration: '0.4s', pause: '0.3s' },
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '2.5s', fadeOut: '0s' },
  ],
};
