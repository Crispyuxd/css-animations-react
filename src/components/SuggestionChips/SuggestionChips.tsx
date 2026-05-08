import styles from './SuggestionChips.module.css';

export function SuggestionChips({
  id,
  overlay,
  children,
}: {
  id: string;
  overlay?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={`${styles.wrap} ${overlay ? styles.overlay : ''}`}>
      <div className={styles.row}>{children}</div>
    </div>
  );
}

export function SuggestionChip({
  id,
  icon,
  children,
}: {
  id?: string;
  icon?: React.ReactNode;
  children: string;
}) {
  return (
    <button id={id} type="button" className={styles.chip} aria-label={children}>
      <span data-hover className={styles.hover} aria-hidden="true" />
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span data-hover-text className={styles.label}>{children}</span>
      <span data-ring className={styles.ring} aria-hidden="true" />
    </button>
  );
}
