import styles from './ConnectedDivider.module.css';
import { UserCircleIcon } from '@/icons';

export function ConnectedDivider({ id, name, style }: { id: string; name: string; style?: React.CSSProperties }) {
  return (
    <div id={id} className={styles.divider} style={style}>
      <div className={styles.line} />
      <div className={styles.label}>
        <UserCircleIcon />
        <span>{name}</span>
      </div>
      <div className={styles.line} />
    </div>
  );
}
