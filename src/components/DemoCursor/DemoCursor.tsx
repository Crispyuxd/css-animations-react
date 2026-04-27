import styles from './DemoCursor.module.css';
import { CursorPointer } from '@/icons';

export function DemoCursor({ id }: { id: string }) {
  return <div id={id} className={styles.cursor}><CursorPointer /></div>;
}
