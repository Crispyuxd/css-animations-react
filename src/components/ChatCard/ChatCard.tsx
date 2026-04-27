import styles from './ChatCard.module.css';

export function ChatCard({ children, ariaLabel = 'AI Agent chat' }: { children: React.ReactNode; ariaLabel?: string }) {
  return <div className={styles.card} role="region" aria-label={ariaLabel}>{children}</div>;
}
