import styles from './ConnectedDivider.module.css';
import { UserCircleIcon } from '@/icons';

export function ConnectedDivider({ id, name }: { id: string; name: string }) {
  return (
    <div id={id} className={styles.divider}>
      <div className={styles.line} />
      <div className={styles.label}>
        <UserCircleIcon />
        <span>{name}</span>
      </div>
      <div className={styles.line} />
    </div>
  );
}
