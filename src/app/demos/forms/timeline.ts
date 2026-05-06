import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '35s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s', meta: { id: 'meta-0' } },

    // User asks
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.72s' },

    // Bot offers form
    { type: 'bot', id: 'bot-2', lines: [29], pause: '0.36s' },

    // Form card slides in
    { type: 'widget', id: 'form-card', duration: '0.4s', pause: '0.2s' },

    // Scroll just enough to match Figma frame 4: bot-1 / user-1 fully off
    // above, bot-2 text at the very top, form fully visible, meta above input.
    { type: 'scroll', target: 'forms-scroll', y: -125, duration: '0.6s', pause: '0.2s' },

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
    { type: 'bot', id: 'email-value', duration: '0.7s', pause: '0.3s' },
    { type: 'deselect', target: 'field-email-value', duration: '0.2s', pause: '0s' },

    // === Message field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'field-msg-value', travel: '0.7s', click: '0.12s', pause: '0.2s', select: 'field-msg-value', mode: 'text' },
      ],
    },
    { type: 'transition', hide: 'msg-placeholder', show: 'noop-msg-pl', duration: '0.1s', pause: '0s' },
    { type: 'bot', id: 'msg-value', lines: [31, 32, 34, 36, 36, 42], cps: 90, pause: '0.3s' },
    { type: 'deselect', target: 'field-msg-value', duration: '0.2s', pause: '0s' },

    // === Add attachment === Click → simulated file-picker delay → files appear
    // (no cursor visits on the rows — those have remove-X buttons; clicking
    // them would mean deleting, which is the opposite of what we want).
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-attach', travel: '0.7s', click: '0.12s', pause: '0.6s', select: 'btn-attach' },
      ],
    },

    // Files appear with a quick stagger, like a file picker resolved.
    // Both attachments live in a gap:16 wrapper alongside AttachButton (per
    // Figma node 807:11883). `collapse` zeroes each item's layout footprint
    // pre-show: height 0 + margin-top -16 cancels its leading gap, so the
    // wrapper hugs AttachButton when no files are present and grows by
    // exactly 36px (16 gap + 20 row) per file as it slides in.
    { type: 'widget', id: 'attach-1', duration: '0.25s', pause: '0.12s', collapse: { height: '20px', marginTop: '-16px' } },
    { type: 'widget', id: 'attach-2', duration: '0.25s', pause: '0.2s', collapse: { height: '20px', marginTop: '-16px' } },

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

    // Form fades out, success state's bot-3 wrapper fades in (success-card
    // inside is initially hidden via its own widget keyframe — see below).
    { type: 'transition', hide: 'state-form', show: 'state-success', duration: '0.6s', pause: '0.36s' },

    // Bot announces first (typewriter), THEN success card appears below.
    // This is the natural order: bot says "submitted" → result card shows up.
    { type: 'bot', id: 'bot-3', lines: [42, 52], pause: '0.3s' },
    { type: 'widget', id: 'success-card', duration: '0.45s', slideY: '12px', pause: '0.3s' },

    // Final timestamp
    { type: 'meta', id: 'meta-2', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
