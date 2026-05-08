import styles from './ChatCard.module.css';

export function ChatCard({ children, ariaLabel = 'AI Agent chat' }: { children: React.ReactNode; ariaLabel?: string }) {
  // Outer wrapper reserves the scaled footprint (406×732 × --card-scale)
  // so page layout matches the visible area. The inner .card keeps its
  // native 406×732 dimensions; transform: scale(var(--card-scale))
  // shrinks the rendered visual without changing any internal layout,
  // animation, or scroll math — every demo's offsets/cursor/timing stays
  // identical regardless of scale. Default 1 (native); override on a
  // parent via --card-scale: 0.7 for the dashboard widget size.
  return (
    <div className={styles.scaledWrap}>
      <div className={`${styles.card} chatCard`} role="region" aria-label={ariaLabel}>{children}</div>
    </div>
  );
}
