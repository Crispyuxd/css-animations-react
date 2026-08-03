import type { TimelineConfig } from '@/lib/types';

// Transfer to human — Figma section 3962:21805 ("Transfer to human"), whose
// three frames are the three beats of one flow:
//   1. the user asks for a person, the agent answers  (state-chat)
//   2. "Calling customer support..."                  (state-call, connecting)
//   3. "Talking to Alex James"                        (state-call, talking)
//
// Layout (offsetTop inside the inner stack; gap 20 + UserMessage margins
// 12/12, and MetaRow in-flow at gap 8 adds 24 to its bot's height):
//   user-1 row          0..45   (marginTop zeroed — first event sits at the inset)
//   bot-1 botBlock     77..161  (text 77..137, meta-1 inline 145..161)
//
// Total content is 161px against a 536px content box, so nothing overflows and
// there is no scroll step in this demo.
//
// Everything from the swap onward is the product's voice call, not a new
// invention: see the `voicecall` step in src/lib/timeline-engine.ts for where
// each phase length and stagger comes from.
//
// Cycle budget (ms):
//   540    introHold
//   1260   user-1 (480 + 240 pause)
//   2460   trace-1 dwell (1200)
//   3896   bot-1 types (47/49/51 chars at 90 cps, accel +0.45)
//   6056   meta-1 fade-in + hold (1800) + 360 pause
//   6796   panel morph (500) + 240 pause
//   9356   call phases (1400 + 700 + 460)
//   9556   last bar finishes growing; the wave is at full amplitude from here
//   13200  stackFadeStart (cycle − outroFade − 0.9s)
//
// That leaves a ~3.6s tail, well above the 1.02–1.58s dwell the other demos
// aim for, and it is deliberate: this demo's payoff is the waveform, and the
// waveform is an ambient 1.6s loop rather than a step, so the audit's "dwell"
// is really the wave's stage time. 3.6s is a bit over two full oscillations.
// Shrinking it to the house dwell would fade the wave out about when it starts.
export const timeline: TimelineConfig = {
  cycle: '15s',
  introHold: '0.54s',
  outroFade: '0.9s',
  metaFadeIn: '0.36s',
  metaHold: '0.9s',
  metaFadeOut: '0.36s',
  steps: [
    // The user opens the turn, so there is no greeting above it to scroll away.
    { type: 'user', id: 'user-1', pause: '0.24s' },

    // The agent thinks before handing off, same as escalation's bot-2.
    { type: 'thinking', id: 'trace-1' },

    // Engine defaults (90 cps, accel +0.45) — the assistant's own streaming
    // voice. meta-1 uses fadeOut '0s' so the timestamp and thumbs stay at
    // opacity 1 and morph away with the panel instead of fading first.
    { type: 'bot', id: 'bot-1', lines: [47, 49, 51], pause: '0.36s',
      meta: { id: 'meta-1', hold: '1.44s', fadeOut: '0s' } },

    // Chat body → call surface. `morph: true` is the same coordinated
    // scale+blur the forms demo uses for state-form → state-success: both
    // halves meet at 0.86 with a soft blur so it reads as one surface
    // changing rather than two panels cross-fading.
    { type: 'transition', hide: 'state-chat', show: 'state-call', duration: '0.5s', morph: true, pause: '0.24s' },

    // Phase lengths omitted on purpose — the defaults ARE the product's
    // CALL_PHASES (1.4s / 0.7s / 0.46s). Only override to retime a demo.
    { type: 'voicecall', id: 'call' },
  ],
};
