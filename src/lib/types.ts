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
  | { type: 'widget'; id: string; duration?: TimeValue; pause?: TimeValue; slideY?: string; collapse?: { height: string; marginTop?: string }; shimmer?: boolean; ease?: string; parallel?: boolean }
  | { type: 'cursor'; id: string; startX?: number; startY?: number; appear?: TimeValue; waypoints: CursorWaypoint[]; rest?: { x?: number; y?: number; travel?: TimeValue } }
  | { type: 'select'; id: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'transition'; hide: string; show: string; duration?: TimeValue; pause?: TimeValue; slideOutY?: string; morph?: boolean; parallel?: boolean }
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
