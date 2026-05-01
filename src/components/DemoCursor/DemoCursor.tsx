import styles from './DemoCursor.module.css';
import { CursorPointer, CursorText } from '@/icons';

export function DemoCursor({ id }: { id: string }) {
  return (
    <div id={id} className={styles.cursor}>
      <span id={`${id}-pointer`} className={styles.icon}><CursorPointer /></span>
      <span id={`${id}-text`} className={`${styles.icon} ${styles.iconText}`}><CursorText /></span>
    </div>
  );
}
