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
  | { type: 'bot'; id: string; duration?: TimeValue; pause?: TimeValue; lines?: number | number[]; cps?: number; meta?: MetaConfig;
      /** Reveal style. 'type' (default) = clip-path typewriter. 'words' = per-word fade-in stagger (LLM-streamed feel). */
      mode?: 'type' | 'words';
      /** Filled in by useTimeline at mount when mode='words'. Number of [data-word] elements inside #id. */
      wordCount?: number;
      /** Stagger between successive words in word mode. Default 40ms. */
      wordStagger?: TimeValue;
      /** Per-word reveal duration in word mode. Default 0.28s. */
      wordDuration?: TimeValue;
    }
  | { type: 'user'; id: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'meta'; id: string; fadeIn?: TimeValue; hold?: TimeValue; fadeOut?: TimeValue; pause?: TimeValue; parallel?: boolean }
  | { type: 'divider'; id: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'widget'; id: string; duration?: TimeValue; pause?: TimeValue; slideY?: string; shimmer?: boolean;
      /** Collapse vertical layout space until widget animates in. Useful for items that should not occupy space in the parent flex layout until they're visible (e.g. attachment slots). Animates max-height + negative margin-top alongside opacity. */
      collapse?: boolean;
      /** Approximate natural height for the collapse expansion target. Default 60px. */
      collapseTo?: string;
      /** Negative top margin to consume the parent flex gap when collapsed. Default 16px (matches FormCard's gap). */
      collapseGap?: string;
    }
  | { type: 'cursor'; id: string; startX?: number; startY?: number; appear?: TimeValue; waypoints: CursorWaypoint[] }
  | { type: 'select'; id: string; duration?: TimeValue; pause?: TimeValue }
  | { type: 'transition'; hide: string; show: string; duration?: TimeValue; pause?: TimeValue; slideOutY?: string }
  | { type: 'scroll'; target: string; y: number; duration?: TimeValue; pause?: TimeValue }
  | { type: 'deselect'; target: string; duration?: TimeValue; pause?: TimeValue };

export interface TimelineConfig {
  cycle: TimeValue;
  introHold?: TimeValue;
  outroFade?: TimeValue;
  metaFadeIn?: TimeValue;
  metaHold?: TimeValue;
  metaFadeOut?: TimeValue;
  steps: TimelineStep[];
  /**
   * Pilot flag — when true the engine emits composite-only motion: cursor
   * uses translate3d (not left/top), animated selectors get will-change, and
   * focus rings tween a sibling [data-ring] overlay's opacity instead of the
   * parent's box-shadow. Forms demo is the first opt-in; others stay on the
   * legacy path until validated.
   */
  smoothMode?: boolean;
}
