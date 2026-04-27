import styles from './ChatHeader.module.css';
import { SparkleAvatar, MoreHorizontal, CancelClose } from '@/icons';

export function ChatHeader({ title = 'AI Agent' }: { title?: string }) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <div className={styles.avatar} aria-hidden="true"><SparkleAvatar /></div>
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.actions} aria-hidden="true">
        <span className={styles.iconBtn}><MoreHorizontal /></span>
        <span className={styles.iconBtn}><CancelClose /></span>
      </div>
    </div>
  );
}
