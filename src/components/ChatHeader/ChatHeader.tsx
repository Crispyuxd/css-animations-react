import styles from './ChatHeader.module.css';
import { AgentAvatar } from '@/icons';

export function ChatHeader({ title = 'AI Agent' }: { title?: string }) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <div className={styles.avatar} aria-hidden="true"><AgentAvatar /></div>
        <span className={styles.title}>{title}</span>
      </div>
    </div>
  );
}
