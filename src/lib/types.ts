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
}

export type TimelineStep =
  | { type: 'bot'; id: string; duration?: TimeValue; pause?: TimeValue; lines?: number | number[]; cps?: number; accel?: number; meta?: MetaConfig; caret?: boolean }
  | { type: 'user'; id: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'meta'; id: string; fadeIn?: TimeValue; hold?: TimeValue; fadeOut?: TimeValue; pause?: TimeValue; parallel?: boolean }
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
