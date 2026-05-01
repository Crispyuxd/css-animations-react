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
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
