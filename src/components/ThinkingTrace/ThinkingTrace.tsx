import styles from './ThinkingTrace.module.css';
import { ThinkingMark } from '@/icons';

interface ThinkingTraceProps {
  id: string;
  /** Shown as "Completed N actions" once the trace settles. */
  count?: number;
  /** Negative marginBottom to trim the stack gap to the internal-to-turn 8px
   *  (see docs/CHAT_LAYOUT.md — the trace belongs to the reply below it). */
  style?: React.CSSProperties;
}

/**
 * The product widget's message trace, header only
 * (sunshine/message-trace.tsx MessageTrace, collapsed disclosure).
 *
 * Two states stacked in a fixed-height row so nothing below ever shifts: the
 * spinning mark plus a shimmering "Thinking", and "Completed N actions". The
 * `thinking` timeline step fades the first in, then cuts to the second while
 * the mark collapses its width so the label slides left into the gap. The
 * label swap is instant on purpose — that is a DOM swap in the product, and
 * the eye tracks the collapsing mark, not the text.
 */
export function ThinkingTrace({ id, count = 1, style }: ThinkingTraceProps) {
  return (
    <div className={styles.trace} style={style}>
      <span id={`${id}-thinking`} className={styles.state}>
        <span className={styles.markBox}>
          <span className={styles.mark}><ThinkingMark /></span>
        </span>
        <span className={styles.shimmer}>Thinking</span>
      </span>

      <span id={`${id}-done`} className={styles.state}>
        {/* Width/margin/opacity animated by the timeline; the spin lives on the
            inner span so the generated id rule can't replace it. */}
        <span id={`${id}-mark`} className={styles.markBox}>
          <span className={styles.mark}><ThinkingMark /></span>
        </span>
        <span>Completed {count} {count === 1 ? 'action' : 'actions'}</span>
      </span>
    </div>
  );
}
