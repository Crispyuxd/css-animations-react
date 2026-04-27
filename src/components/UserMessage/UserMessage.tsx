import styles from './UserMessage.module.css';

export function UserMessage({ id, children, wrap }: { id: string; children: string; wrap?: boolean }) {
  return (
    <div id={id} className={styles.userRow}>
      <div className={`${styles.bubble} ${wrap ? styles.wrap : ''}`}>{children}</div>
    </div>
  );
}
