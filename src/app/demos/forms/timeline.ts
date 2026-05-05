import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  smoothMode: true,
  cycle: '35s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets
    { type: 'bot', id: 'bot-1', duration: '1.26s', pause: '0.36s', meta: { id: 'meta-0' } },

    // User asks
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.72s' },

    // Bot offers form
    { type: 'bot', id: 'bot-2', duration: '1.26s', pause: '0.36s' },

    // Form card slides in
    { type: 'widget', id: 'form-card', duration: '0.4s', pause: '0.2s' },

    // Small initial scroll — pushes bot-1 mostly off so form + meta fit in
    // the visible chat area. Matches Figma frame 807:11615.
    { type: 'scroll', target: 'forms-scroll', y: -80, duration: '0.5s', pause: '0.1s' },

    // "Just now" timestamp (parallel, stays visible while form fills)
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // === Email field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-form',
      startX: 280, startY: 480,
      appear: '0.3s',
      waypoints: [
        { target: 'field-email-value', travel: '0.7s', click: '0.12s', pause: '0.2s', select: 'field-email-value', mode: 'text' },
      ],
    },
    { type: 'transition', hide: 'email-placeholder', show: 'noop-email-pl', duration: '0.1s', pause: '0s' },
    { type: 'bot', id: 'email-value', duration: '1.26s', pause: '0.3s' },
    { type: 'deselect', target: 'field-email-value', duration: '0.2s', pause: '0s' },

    // === Message field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'field-msg-value', travel: '0.7s', click: '0.12s', pause: '0.2s', select: 'field-msg-value', mode: 'text' },
      ],
    },
    { type: 'transition', hide: 'msg-placeholder', show: 'noop-msg-pl', duration: '0.1s', pause: '0s' },
    { type: 'bot', id: 'msg-value', lines: 6, duration: '7.56s', pause: '0.3s' },
    { type: 'deselect', target: 'field-msg-value', duration: '0.2s', pause: '0s' },

    // === Add attachment === Click → scroll up immediately → files appear.
    // (no cursor visits on the rows — those have remove-X buttons; clicking
    // them would mean deleting, which is the opposite of what we want).
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-attach', travel: '0.7s', click: '0.12s', pause: '0.1s', select: 'btn-attach' },
      ],
    },

    // Scroll fires right after the click — the scroll duration itself acts as
    // the file-picker delay so the click→scroll→files flow reads as one beat.
    { type: 'scroll', target: 'forms-scroll', y: -160, duration: '0.5s', pause: '0s' },

    // Files appear with a quick stagger, like a file picker resolved.
    // collapse:true keeps them out of layout (max-height 0, neg margin) until
    // they animate in — matches Figma "before attachments" form-card height.
    { type: 'widget', id: 'attach-1', duration: '0.25s', pause: '0.12s', collapse: true },
    { type: 'widget', id: 'attach-2', duration: '0.25s', pause: '0.2s', collapse: true },

    // AttachButton border returns to default once files have arrived
    { type: 'deselect', target: 'btn-attach', duration: '0.2s', pause: '0.1s' },

    // === Submit ===
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-submit', travel: '0.7s', click: '0.12s', pause: '0.3s', select: 'btn-submit' },
      ],
    },

    // Scroll back to top so the success state appears in view
    { type: 'scroll', target: 'forms-scroll', y: 0, duration: '0.4s', pause: '0s' },

    // Form fades out, success state fades in. Pause briefly so the eye lands
    // on the empty success state before the result card pops.
    { type: 'transition', hide: 'state-form', show: 'state-success', duration: '0.6s', pause: '0.18s' },

    // Success card pops IMMEDIATELY — people want confirmation they can see,
    // not a 3-second wait while the bot types. Bot's explanatory text follows.
    { type: 'widget', id: 'success-card', duration: '0.45s', slideY: '12px', pause: '0.18s', shimmer: true },
    { type: 'bot', id: 'bot-3', duration: '2.52s', lines: 2, pause: '0.3s' },

    // Final timestamp
    { type: 'meta', id: 'meta-2', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
