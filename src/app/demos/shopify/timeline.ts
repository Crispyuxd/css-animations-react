import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '29s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s',
      meta: { id: 'meta-0' } },
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.72s' },
    { type: 'bot', id: 'bot-2', duration: '1.62s', pause: '0.3s' },

    // Phase: categories
    { type: 'widget', id: 'categories-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-cat', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
    { type: 'cursor', id: 'cursor-cat',
      startX: 290, startY: 50,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-mens-view', travel: '0.7s', click: '0.12s', pause: '0.4s' },
      ],
    },

    // Transition: categories → picker
    { type: 'transition', hide: 'state-categories', show: 'state-picker', duration: '0.5s', pause: '0s' },
    { type: 'widget', id: 'picker-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-picker', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // Phase: pick first product (XY Metcon 64)
    { type: 'cursor', id: 'cursor-pick-1',
      startX: 280, startY: 60,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-metcon', travel: '0.6s', click: '0.12s', pause: '0.3s' },
      ],
    },
    // Overlay fades in
    { type: 'widget', id: 'sheet-overlay', duration: '0.3s', pause: '0s', slideY: '0px' },
    // Sheet slides up from bottom
    { type: 'widget', id: 'sheet-metcon', duration: '0.5s', pause: '0.2s', slideY: '100%' },
    { type: 'cursor', id: 'cursor-sheet-1',
      startX: 320, startY: 320,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-add-metcon', travel: '0.5s', click: '0.12s', pause: '0.3s' },
      ],
    },
    // Sheet slides down (overlay stays for next product)
    { type: 'transition', hide: 'sheet-metcon', show: 'noop-1', duration: '0.4s', pause: '0s', slideOutY: '100%' },
    // After Metcon's "Add to cart": Select options button → quantity stepper
    { type: 'transition', hide: 'btn-metcon', show: 'qty-metcon', duration: '0.3s', pause: '0.2s', slideOutY: '0px' },

    // Phase: pick second product (XY V2 Run)
    { type: 'cursor', id: 'cursor-pick-2',
      startX: 280, startY: 200,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-v2run', travel: '0.6s', click: '0.12s', pause: '0.3s' },
      ],
    },
    { type: 'widget', id: 'sheet-v2run', duration: '0.5s', pause: '0.2s', slideY: '100%' },
    { type: 'cursor', id: 'cursor-sheet-2',
      startX: 320, startY: 320,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-add-v2run', travel: '0.5s', click: '0.12s', pause: '0.3s' },
      ],
    },
    { type: 'transition', hide: 'sheet-v2run', show: 'noop-2', duration: '0.4s', pause: '0s', slideOutY: '100%' },
    // After V2 Run's "Add to cart": Select options button → quantity stepper
    { type: 'transition', hide: 'btn-v2run', show: 'qty-v2run', duration: '0.3s', pause: '0.6s', slideOutY: '0px' },
    // Overlay fades out
    { type: 'transition', hide: 'sheet-overlay', show: 'noop-3', duration: '0.3s', pause: '0s', slideOutY: '0px' },

    // Transition: picker → cart
    { type: 'transition', hide: 'state-picker', show: 'state-cart', duration: '0.5s', pause: '0s' },
    { type: 'widget', id: 'cart-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-cart', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
    { type: 'cursor', id: 'cursor-cart',
      startX: 290, startY: 100,
      appear: '0.3s',
      waypoints: [
        { target: 'btn-checkout', travel: '0.7s', click: '0.12s', pause: '0.3s' },
      ],
    },

    // Transition: cart → success
    { type: 'transition', hide: 'state-cart', show: 'state-success', duration: '0.5s', pause: '0s' },
    { type: 'widget', id: 'success-widget', duration: '0.4s', pause: '0.2s' },
    { type: 'meta', id: 'meta-success', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
