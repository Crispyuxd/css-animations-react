import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '35s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets — typewriter at comfortable AI-streamed pace
    { type: 'bot', id: 'bot-1', lines: [20], cps: 45, accel: 0.9, pause: '0.36s', meta: { id: 'meta-0' } },

    // User asks
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.36s' },

    // Turn-anchor: scroll user-1 right to the top (offsetTop 52 → +8 visible).
    // The 12px margin-top + 12px margin-bottom on UserMessage establishes the
    // bubble's boundary; scrolling to -44 puts that boundary's TOP edge at the
    // visible top with bot-1's last few px peeking above as "previous turn".
    { type: 'scroll', target: 'forms-scroll', y: -44, duration: '0.4s', pause: '0.16s' },

    // Bot offers form (typewriter types in below user-1, no scroll change)
    { type: 'bot', id: 'bot-2', lines: [29], cps: 45, accel: 0.9, pause: '0.36s' },

    // Form card slides in below bot-2. At scroll -44 the empty form (438px)
    // fits within the visible area: user-1 at top, bot-2 below, full form,
    // meta+input below — agent's message stays visible.
    { type: 'widget', id: 'form-card', duration: '0.4s', pause: '0.18s' },

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
    // Email — brisk; user knows their own address. Single-line so duration
    // path (FormInputRow renders one <span>; lines:[] would mis-target).
    { type: 'bot', id: 'email-value', duration: '0.4s', pause: '0.3s' },
    { type: 'deselect', target: 'field-email-value', duration: '0.2s', pause: '0s' },

    // === Message field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'field-msg-value', travel: '0.7s', click: '0.12s', pause: '0.2s', select: 'field-msg-value', mode: 'text' },
      ],
    },
    { type: 'transition', hide: 'msg-placeholder', show: 'noop-msg-pl', duration: '0.1s', pause: '0s' },
    // Message body — fast-but-human start; gentle decay sells "typing slows
    // as user thinks deeper". 65 cps line 1 → ~40 cps line 6.
    { type: 'bot', id: 'msg-value', lines: [31, 32, 34, 36, 36, 42], cps: 65, accel: 0.92, pause: '0.3s' },
    { type: 'deselect', target: 'field-msg-value', duration: '0.2s', pause: '0s' },

    // === Add attachment === Click triggers a deeper scroll to make room
    // for the incoming attachment rows (form will grow from 438 → 510 tall).
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-attach', travel: '0.7s', click: '0.12s', pause: '0.1s', select: 'btn-attach' },
      ],
    },

    // Scroll deeper so the form's bottom (with attachments + Submit) is
    // clearly visible. -113 puts form-card top at +48, form bottom at +558
    // (40px breathing room below before meta + chat input). bot-2 stays at
    // +16 — agent's message remains visible, just at the very top edge.
    { type: 'scroll', target: 'forms-scroll', y: -113, duration: '0.5s', pause: '0s' },

    // Files appear into the now-roomier view. `collapse` zeroes each item's
    // layout footprint pre-show: height 0 + margin-top -16 cancels its
    // leading gap so the wrapper hugs AttachButton when no files are
    // present and grows by exactly 36px (16 gap + 20 row) per file as
    // it slides in (Figma node 807:11883).
    { type: 'widget', id: 'attach-1', duration: '0.25s', pause: '0.12s', collapse: { height: '20px', marginTop: '-16px' } },
    { type: 'widget', id: 'attach-2', duration: '0.25s', pause: '0.2s', collapse: { height: '20px', marginTop: '-16px' } },

    // AttachButton border returns to default once files have arrived. Stay
    // anchored at -113 — Submit is in view, no need to pull back to user-1
    // until AFTER the action completes.
    { type: 'deselect', target: 'btn-attach', duration: '0.2s', pause: '0.4s' },

    // === Submit ===
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-submit', travel: '0.7s', click: '0.12s', pause: '0.3s', select: 'btn-submit' },
      ],
    },

    // Morph happens at scroll -113 (form-card visible position). The
    // wrapper at offsetTop 129 sits at +16 in the visible area during the
    // morph itself, so state-success appears in the form's old slot.

    // Form MORPHS into the success state — both elements meet at scale 0.86
    // with opposite tilts and a soft blur for a single-shape transformation.
    // 30% cross-fade overlap window keeps the morph reading as continuous.
    { type: 'transition', hide: 'state-form', show: 'state-success', duration: '0.7s', pause: '0.18s', morph: true },

    // After the morph, pull back so user-1's chat bubble re-enters view
    // alongside the success state. Camera "steps back" to frame the
    // completed conversation: user message at top, AI's success below.
    { type: 'scroll', target: 'forms-scroll', y: -44, duration: '0.5s', pause: '0.18s' },

    // Success card pops IMMEDIATELY after the morph (people want to see
    // confirmation, not wait for bot-3 to type first). Bot follow-up below.
    { type: 'widget', id: 'success-card', duration: '0.45s', slideY: '12px', pause: '0.18s', shimmer: true },
    // Bot success follow-up — calm pace with gentle decay
    { type: 'bot', id: 'bot-3', lines: [42, 52], cps: 50, accel: 0.92, pause: '0.3s' },

    // Final timestamp
    { type: 'meta', id: 'meta-2', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
