import styles from './UserMessage.module.css';

export function UserMessage({ id, children, wrap, style }: { id: string; children: string; wrap?: boolean; style?: React.CSSProperties }) {
  return (
    <div id={id} className={styles.userRow} style={style}>
      <div className={`${styles.bubble} ${wrap ? styles.wrap : ''}`}>{children}</div>
    </div>
  );
}
