import type { TimelineConfig } from '@/lib/types';

export const timeline: TimelineConfig = {
  cycle: '35s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // Bot greets — typewriter at comfortable AI-streamed pace.
    // meta-0 ("Just now" + thumbs) uses fadeOut '0s' so it stays visible
    // through the scroll and translates up alongside bot-1 instead of
    // fading out first.
    { type: 'bot', id: 'bot-1', lines: [20], cps: 45, accel: 0.9, pause: '0.36s', meta: { id: 'meta-0', fadeOut: '0s' } },

    // Turn-anchor (parallel): the stack scrolls up at the same moment user-1
    // pops in, so the bubble feels anchored at the top from the first frame
    // instead of appearing in place and then sliding up.
    //
    // y: -67 hides the entire bot-1 block — text + the absolutely-positioned
    // MetaRow ("Just now" + thumbs) which sits in the 20px gap below bot-1's
    // text. -44 pulled the text out but left meta-0 visible at the top edge;
    // an extra 20px lifts meta-0 above the viewport too so the bot turn feels
    // like one cohesive block scrolling out together.
    { type: 'scroll', target: 'forms-scroll', y: -67, duration: '0.5s', parallel: true },

    // User asks — pops in concurrently with the scroll above
    { type: 'user', id: 'user-1', duration: '0.54s', pause: '0.36s' },

    // Bot offers form (typewriter types in below user-1, no scroll change)
    { type: 'bot', id: 'bot-2', lines: [29], cps: 45, accel: 0.9, pause: '0.36s' },

    // No camera pan at form pop-up — same -67 scroll as the turn-anchor so
    // user-1 stays put when the form arrives (no shift / no clip). The
    // tightened forms-scroll gap (10 instead of 20) and the user-1 margin
    // adjustments shift the form-card high enough in the layout that meta-1
    // ("Just now") fits within the visible area at the same -67 anchor.
    { type: 'scroll', target: 'forms-scroll', y: -67, duration: '0.55s', parallel: true },

    // Form card slides in below bot-2. user-1 stays at the top edge with the
    // same 12px header gap as the initial turn-anchor — the camera pans down
    // exactly enough to bring the form into view without clipping the bubble.
    { type: 'widget', id: 'form-card', duration: '0.55s', slideY: '12px', pause: '0.18s' },

    // "Just now" timestamp fades in right after the form arrives — meta-1
    // now sits within the visible area at the -77 form pop-up scroll, so
    // the fade-in is observable instead of firing invisibly below the fold.
    { type: 'meta', id: 'meta-1', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },

    // === Email field — pointer travels in, becomes I-beam at click ===
    // After the click, cursor parks on the right edge instead of fading out
    // — feels more like a real user moving the mouse aside while typing.
    { type: 'cursor', id: 'cursor-form',
      startX: 280, startY: 480,
      appear: '0.25s',
      waypoints: [
        { target: 'field-email-value', travel: '0.7s', click: '0.1s', pause: '0.15s', select: 'field-email-value', mode: 'text' },
      ],
      rest: { travel: '0.25s' },
    },
    { type: 'transition', hide: 'email-placeholder', show: 'noop-email-pl', duration: '0.1s', pause: '0s' },
    // Email — brisk; user knows their own address. Single-line so duration
    // path (FormInputRow renders one <span>; lines:[] would mis-target).
    { type: 'bot', id: 'email-value', duration: '0.4s', pause: '0.3s', caret: true },
    { type: 'deselect', target: 'field-email-value', duration: '0.2s', pause: '0s' },

    // === Message field — pointer travels in, becomes I-beam at click ===
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'field-msg-value', travel: '0.6s', click: '0.1s', pause: '0.15s', select: 'field-msg-value', mode: 'text' },
      ],
      rest: { travel: '0.25s' },
    },
    { type: 'transition', hide: 'msg-placeholder', show: 'noop-msg-pl', duration: '0.1s', pause: '0s' },
    // Message body — fast-but-human start; gentle decay sells "typing slows
    // as user thinks deeper". 65 cps line 1 → ~40 cps line 6.
    { type: 'bot', id: 'msg-value', lines: [31, 32, 34, 36, 36, 42], cps: 65, accel: 0.92, pause: '0.3s', caret: true },
    { type: 'deselect', target: 'field-msg-value', duration: '0.2s', pause: '0s' },

    // === Add attachment === Click triggers a deeper scroll to make room
    // for the incoming attachment rows (form will grow from 438 → 510 tall).
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-attach', travel: '0.6s', click: '0.1s', pause: '0.08s', select: 'btn-attach' },
      ],
      rest: { travel: '0.25s' },
    },

    // Scroll deeper so the form's bottom (with attachments + Submit) is
    // clearly visible. With both attachments rendered the form-card is
    // ~510px tall — -139 lifts the card up enough that its bottom border
    // (and the meta-1 row below it) sit clearly within the visible area,
    // without clipping the card's top edge.
    { type: 'scroll', target: 'forms-scroll', y: -139, duration: '0.5s', pause: '0s' },

    // Files appear into the now-roomier view. `collapse` zeroes each item's
    // layout footprint pre-show: height 0 + margin-top -16 cancels its
    // leading gap so the wrapper hugs AttachButton when no files are
    // present and grows by exactly 36px (16 gap + 20 row) per file as
    // it slides in (Figma node 807:11883).
    //
    // `ease: var(--ease-scroll)` overrides the default springy ease-out-quart
    // — the springy curve overshoots and bounces back, which on a height-
    // animating row causes the form-card's bottom edge to visibly oscillate.
    // ease-scroll is a smooth cubic-bezier with no overshoot, so the row
    // grows in once and settles cleanly.
    { type: 'widget', id: 'attach-1', duration: '0.5s', slideY: '6px', pause: '0.18s', collapse: { height: '20px', marginTop: '-16px' }, ease: 'var(--ease-scroll)' },
    { type: 'widget', id: 'attach-2', duration: '0.5s', slideY: '6px', pause: '0.24s', collapse: { height: '20px', marginTop: '-16px' }, ease: 'var(--ease-scroll)' },

    // AttachButton border returns to default once files have arrived. Stay
    // anchored at -113 — Submit is in view, no need to pull back to user-1
    // until AFTER the action completes.
    { type: 'deselect', target: 'btn-attach', duration: '0.2s', pause: '0.4s' },

    // === Submit ===
    // Tight 0.1s click pause — the morph fires almost immediately after the
    // press so it reads as a single "submit → success" beat instead of two.
    { type: 'cursor', id: 'cursor-form',
      waypoints: [
        { target: 'btn-submit', travel: '0.6s', click: '0.1s', pause: '0.1s', select: 'btn-submit' },
      ],
    },

    // Camera pan runs IN PARALLEL with the morph below. The view glides from
    // -113 → -64 (anchoring user-1 at the top) while the form-card morphs
    // into the success-card simultaneously — one continuous motion.
    { type: 'scroll', target: 'forms-scroll', y: -67, duration: '1.0s', parallel: true },

    // Form card MORPHS into the success card. `parallel: true` so the bot
    // text untype/swap/type below run DURING the morph — success text and
    // success card appear together as one beat. Slowed to 1.0s so the card
    // doesn't fully resolve before bot-3 has had a chance to type its first
    // line — keeps the appearance natural instead of "card pops, then text".
    // success-card has no separate widget animation, so it inherits visibility
    // from state-success and becomes visible as the morph reveals the wrapper.
    { type: 'transition', hide: 'state-form', show: 'state-success', duration: '1.0s', morph: true, parallel: true },

    // Bot-2 backspaces — runs concurrent with the card morph above. ~64 cps
    // gives a brisk erase that reads as the agent retracting its previous
    // line before committing to the success message.
    { type: 'untype', target: 'bot-2-line-1', duration: '0.45s', pause: '0.05s' },

    // Wrapper swap is purely an opacity flip — bot-3's lines are still clipped
    // by their own typewriter, so the visible content arrives via `bot-3`
    // below. `parallel: true` keeps cursor on the typewriter's start frame.
    { type: 'transition', hide: 'state-form-bot', show: 'state-success-bot', duration: '0.05s', slideOutY: '0px', parallel: true },

    // Shimmer — fires at submit_end + 0.5s, peaks ~0.5s later (around morph
    // end at submit_end + 1.0s) so the green pulse coincides with the
    // success-card finishing its reveal. Standalone shimmer step so it's
    // decoupled from any widget show animation.
    { type: 'shimmer', target: 'success-card', duration: '0.9s' },

    // Bot success follow-up — fast type with positive acceleration so the
    // text finishes rendering at roughly the same moment the card morph
    // completes (~submit_end + 1.0s). cps 150 base × accel 1.3 lands line 1
    // in ~0.28s and line 2 in ~0.27s, total ~0.55s on top of bot-3's start
    // at submit_end + 0.5s. Reads as the agent confidently delivering the
    // good news — text and card resolve together.
    { type: 'bot', id: 'bot-3', lines: [42, 52], cps: 150, accel: 1.3, pause: '0.3s' },

    // Final timestamp
    { type: 'meta', id: 'meta-2', fadeIn: '0.36s', hold: '0s', fadeOut: '0s', parallel: true },
  ],
};
