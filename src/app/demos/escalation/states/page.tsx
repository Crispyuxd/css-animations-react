import { State1 } from './State1';
import { State2 } from './State2';
import { State3 } from './State3';
import { State4 } from './State4';
import { State5 } from './State5';
import { State6 } from './State6';
import styles from './states.module.css';

const states: Array<{
  id: string;
  label: string;
  description: string;
  Component: React.ComponentType;
}> = [
  {
    id: 's1',
    label: 'State 1 · AI bot greeting',
    description: 'Bot-1 has finished typing its greeting; meta-0 ("Just now" + thumbs) is visible.',
    Component: State1,
  },
  {
    id: 's2',
    label: 'State 2 · User-1 anchored at top',
    description: 'User-1 has popped in and the camera has anchored it at the top of the viewport. Bot-1 + meta-0 have scrolled above.',
    Component: State2,
  },
  {
    id: 's3',
    label: 'State 3 · Bot-2 reply complete',
    description: 'Bot-2 has finished typing its 2-line reply with meta-1 visible. User-1 is still anchored at top.',
    Component: State3,
  },
  {
    id: 's4',
    label: 'State 4 · Mark Kent connected, bot-3 typed',
    description: 'Connection divider has arrived in its natural position; Mark Kent\'s first reply (bot-3) is fully typed with meta-2 visible.',
    Component: State4,
  },
  {
    id: 's5',
    label: 'State 5 · User-2 anchored at top',
    description: 'User-2 has popped in; the entire prior block (bot-2, meta-1, divider, bot-3, meta-2) has scrolled above as one unit.',
    Component: State5,
  },
  {
    id: 's6',
    label: 'State 6 · Mark Kent\'s final reply',
    description: 'Bot-4 has finished typing with meta-3 visible. This is the held final frame before the loop restarts.',
    Component: State6,
  },
];

export default function EscalationStatesPage() {
  return (
    <div className={styles.page}>
      {/* Hide the DebugScrubber on this page — these are static snapshots,
          not running animations, so the scrubber is irrelevant. The
          DebugScrubber's class name is hashed by CSS modules but always
          contains "DebugScrubber". */}
      <style>{`[class*="DebugScrubber"] { display: none !important; }`}</style>
      <div>
        <h1 className={styles.title}>Escalation demo · state pages</h1>
        <p className={styles.subtitle}>
          Each card is a frozen snapshot of one moment in the cycle.
          Use the Agentation toolbar (bottom-right) to annotate exact changes.
        </p>
      </div>

      {states.map(({ id, label, description, Component }) => (
        <div key={id} className={styles.stateBlock}>
          <span className={styles.stateLabel}>{label}</span>
          <p className={styles.stateDescription}>{description}</p>
          <Component />
        </div>
      ))}
    </div>
  );
}
