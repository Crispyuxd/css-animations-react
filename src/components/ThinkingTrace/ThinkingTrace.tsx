import styles from './ThinkingTrace.module.css';
import { ThinkingMark } from '@/icons';

interface ThinkingTraceProps {
  id: string;
}

/**
 * The product widget's trace-off pending indicator — the spinning stacked-cube
 * mark plus a shimmering "Thinking", and nothing else.
 *
 * Source: chatbase-agents `MessageTrace status="thinking" steps={[]}`
 * (Storybook: UI/Message Trace → Thinking No Trace). With no steps there is no
 * chevron, no disclosure, nothing interactive, and the component renders null
 * the moment the reply lands. Quoting the story: "This is the pending indicator
 * every widget shows in place of the old typing dots."
 *
 * It replaces the reply rather than sitting above it, so it is absolutely
 * positioned over the bot message's first line and takes no layout space at
 * all. The `thinking` timeline step fades it in over 200ms and cuts it at the
 * exact frame the reply starts typing, which is how the widget behaves: the
 * indicator unmounts as the message mounts, never both at once.
 */
export function ThinkingTrace({ id }: ThinkingTraceProps) {
  return (
    <span id={id} className={styles.trace}>
      <span className={styles.markBox}>
        <span className={styles.mark}><ThinkingMark /></span>
      </span>
      <span className={styles.shimmer}>Thinking</span>
    </span>
  );
}
