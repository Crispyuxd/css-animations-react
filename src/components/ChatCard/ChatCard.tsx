import styles from './ChatCard.module.css';

export function ChatCard({ children, ariaLabel = 'AI Agent chat' }: { children: React.ReactNode; ariaLabel?: string }) {
  // Outer wrapper takes the scaled footprint (284.2×512.4 = 406×732 × 0.7)
  // so page layout reserves only the visible area. The inner .card keeps
  // its native 406×732 dimensions; transform: scale(0.7) shrinks the
  // rendered visual without changing any internal layout, animation, or
  // scroll math — every demo's offsets/cursor/timing stays identical.
  return (
    <div className={styles.scaledWrap}>
      <div className={`${styles.card} chatCard`} role="region" aria-label={ariaLabel}>{children}</div>
    </div>
  );
}
