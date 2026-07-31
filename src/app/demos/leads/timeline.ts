import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '19s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets — typewriter at AI-streamed pace.
    // meta-0 stays at opacity 1 (fadeOut '0s') so it scrolls up alongside
    // bot-1 instead of fading out before the camera pans.
    { type: 'bot', id: 'bot-1', lines: [20], pause: '0.36s', meta: { id: 'meta-0', fadeOut: '0s' } },

    // Turn-anchor (parallel): the stack scrolls up at the same moment
    // user-1 pops in, so the bubble feels anchored at the inset edge from
    // the first frame. y: -76 lands user-1 at padding-box y=20.
    { type: 'scroll', target: 'leads-scroll', y: -76, duration: '0.5s', parallel: true },
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.36s' },

    // Bot offers form — 2 lines split per Figma frame 2 (~88 chars at 334
    // width). No cps/accel: inherits the product AI voice (90 cps, +45%/line).
    { type: 'bot', id: 'bot-2', lines: [58, 28], pause: '0.36s' },

    // Form-card slides in below bot-2. No camera pan — the form (244 tall)
    // + meta-1 fits inside the content-box at the user-1 anchor (-76).
    { type: 'widget', id: 'form-card', duration: '0.55s', slideY: '12px', pause: '0.18s' },

    // "Just now" timestamp fades in alongside the form-card arrival.
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // === Email field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-leads',
      startX: 280, startY: 480,
      appear: '0.25s',
      waypoints: [
        { target: 'field-email-value', travel: '0.7s', click: '0.1s', pause: '0.15s', select: 'field-email-value', mode: 'text' },
      ],
      rest: { travel: '0.25s' },
    },
    { type: 'transition', hide: 'email-placeholder', show: 'noop-email-pl', duration: '0.1s', pause: '0s' },
    // Brisk; user knows their own email. Single-line so duration path.
    { type: 'bot', id: 'email-value', duration: '0.4s', pause: '0.3s', caret: true },
    { type: 'deselect', target: 'field-email-value', duration: '0.2s', pause: '0s' },

    // === Phone field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-leads',
      waypoints: [
        { target: 'field-phone-value', travel: '0.6s', click: '0.1s', pause: '0.15s', select: 'field-phone-value', mode: 'text' },
      ],
      rest: { travel: '0.25s' },
    },
    { type: 'transition', hide: 'phone-placeholder', show: 'noop-phone-pl', duration: '0.1s', pause: '0s' },
    // Phone number — same brisk pace as email; user knows their own number.
    { type: 'bot', id: 'phone-value', duration: '0.4s', pause: '0.3s', caret: true },
    { type: 'deselect', target: 'field-phone-value', duration: '0.2s', pause: '0s' },

    // === Submit ===
    // Tight 0.1s click pause — morph fires almost immediately so it reads
    // as one "submit → success" beat instead of two.
    { type: 'cursor', id: 'cursor-leads',
      waypoints: [
        { target: 'btn-submit', travel: '0.6s', click: '0.1s', pause: '0.1s', select: 'btn-submit' },
      ],
    },

    // Form-card MORPHS into the success-card. parallel:true so the bot text
    // untype/swap below run DURING the morph — success text and success
    // card resolve together as one beat.
    { type: 'transition', hide: 'state-form', show: 'state-success', duration: '1.0s', morph: true, parallel: true },

    // Bot-2 backspaces — runs concurrent with the card morph above. Line 2
    // clears first (most-recently-typed), then line 1, mirroring a real
    // backspace. Combined ~0.7s fits within the 1.0s morph window.
    { type: 'untype', target: 'bot-2-line-2', duration: '0.3s', pause: '0s' },
    { type: 'untype', target: 'bot-2-line-1', duration: '0.4s', pause: '0.05s' },

    // Wrapper swap is a fast opacity flip; bot-3's lines are still clipped
    // by their own typewriter, so visible content arrives via bot-3 below.
    { type: 'transition', hide: 'state-form-bot', show: 'state-success-bot', duration: '0.05s', slideOutY: '0px', parallel: true },

    // Shimmer — fires during morph; peaks ~0.5s later coincident with
    // the success-card finishing its reveal.
    { type: 'shimmer', target: 'success-card', duration: '0.9s' },

    // Bot-3 success follow-up — fast, confident with positive accel so the
    // 3 lines finish around the time the card morph completes.
    { type: 'bot', id: 'bot-3', lines: [39, 46, 42], cps: 150, accel: 0.3, pause: '0.3s' },

    // Final timestamp
    { type: 'meta', id: 'meta-2', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
