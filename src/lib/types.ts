export type TimeValue = string | number;

export interface MetaConfig {
  id: string;
  fadeIn?: TimeValue;
  hold?: TimeValue;
  fadeOut?: TimeValue;
  pause?: TimeValue;
  parallel?: boolean;
}

export interface CursorWaypoint {
  x?: number;
  y?: number;
  target?: string;     // Element id — useTimeline resolves to (x, y) at mount
  travel?: TimeValue;
  click?: TimeValue;
  pause?: TimeValue;
  select?: string;
  mode?: 'pointer' | 'text';  // cursor shape on click — defaults to 'pointer'
  // Fade-in duration of the target's hover state as the cursor approaches.
  // Hover peaks when the cursor arrives and crossfades out across `click` as
  // `select` takes over. Requires the target element to have [data-hover]
  // and (optionally) [data-hover-text] markup. Implies `select`.
  hover?: TimeValue;
}

export type TimelineStep =
  // `lines` as number[] = per-line char counts (proportional typing).
  // `cps` = base chars/sec for line 1, default 90 (product base).
  // `accel` = LINEAR per-line speed-up, default 0.45 → line N types at
  //   cps * (1 + (N-1) * accel). Negative decelerates (human typist).
  //   Note this is not the old compounding cps * accel^(N-1).
  | { type: 'bot'; id: string; duration?: TimeValue; pause?: TimeValue; lines?: number | number[]; cps?: number; accel?: number; meta?: MetaConfig; caret?: boolean }
  | { type: 'user'; id: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'meta'; id: string; fadeIn?: TimeValue; hold?: TimeValue; fadeOut?: TimeValue; pause?: TimeValue; parallel?: boolean }
  // Drives a <ThinkingTrace id={id} /> (the trace-off pending indicator, passed
  // to BotMessage's `trace` slot). `duration` is how long "Thinking" holds
  // before it cuts out; the cursor advances by exactly that, so the reply below
  // starts typing on the frame the indicator disappears.
  | { type: 'thinking'; id: string; duration?: TimeValue; fadeIn?: TimeValue; pause?: TimeValue }
  | { type: 'divider'; id: string; duration?: TimeValue; pause?: TimeValue }
  // Drives a <CallPanel id={id} /> through the product's voice-call phases.
  // Ported from the widget's phone-call surface (CALL_PHASES + VoiceWaveform):
  //   connecting — one black dot sweeps the 7-dot row (200ms per dot)
  //   settling   — every dot goes black, 40ms stagger
  //   morphing   — the dots grow into the 7-bar waveform, 40ms stagger
  // The resting oscillation that follows runs to the end of the cycle on a
  // 1.6s loop, so it isn't a phase and doesn't advance the cursor.
  // Defaults are the source's exact values; only override to retime a demo.
  // `outro` is the exception — it has no source, because the product's call runs
  // its waveform until the user hangs up. On a loop that means the wave gets
  // taken mid-oscillation by the cycle-end fade, which reads as cut off. Set it
  // and the amplitude eases to rest over that many ms ENDING at the fade start,
  // so the wave settles before the surface leaves. Doesn't advance the cursor.
  // Amplitude only — the surface's own exit belongs to the `transition` step.
  | { type: 'voicecall'; id: string; connecting?: TimeValue; settling?: TimeValue; morphing?: TimeValue; outro?: TimeValue; pause?: TimeValue }
  | { type: 'widget'; id: string; duration?: TimeValue; pause?: TimeValue; slideY?: string; collapse?: { height: string; marginTop?: string }; shimmer?: boolean; ease?: string; parallel?: boolean }
  | { type: 'cursor'; id: string; startX?: number; startY?: number; appear?: TimeValue; waypoints: CursorWaypoint[]; rest?: { x?: number; y?: number; travel?: TimeValue } }
  | { type: 'select'; id: string; duration?: TimeValue; pause?: TimeValue }
  // `surface: true` (morph only) marks this as a swap of the whole card body
  // rather than a card inside the message stack. It softens the crossover so the
  // incoming half fades instead of snapping, and makes the step own the shown
  // surface's exit at the cycle-end fade plus the hidden surface's re-entry at
  // the top of the cycle — both of which an in-stack morph gets for free from
  // .messagesStack. See the morph block in timeline-engine.ts for the numbers.
  | { type: 'transition'; hide: string; show: string; duration?: TimeValue; pause?: TimeValue; slideOutY?: string; morph?: boolean; surface?: boolean; parallel?: boolean }
  | { type: 'scroll'; target: string; y: number; duration?: TimeValue; pause?: TimeValue; parallel?: boolean }
  | { type: 'deselect'; target: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'untype'; target: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'shimmer'; target: string; duration?: TimeValue; pause?: TimeValue };

export interface TimelineConfig {
  cycle: TimeValue;
  introHold?: TimeValue;
  outroFade?: TimeValue;
  metaFadeIn?: TimeValue;
  metaHold?: TimeValue;
  metaFadeOut?: TimeValue;
  steps: TimelineStep[];
}
