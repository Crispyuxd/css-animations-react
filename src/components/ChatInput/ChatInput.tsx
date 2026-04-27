import styles from './ChatInput.module.css';
import { AttachIcon, MicIcon, SendIcon } from '@/icons';

export function ChatInput({ placeholder = 'Ask a question\u2026' }: { placeholder?: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.input}>
        <span className={styles.icon}><AttachIcon /></span>
        <span className={styles.placeholder}>{placeholder}</span>
        <div className={styles.actions}>
          <span className={styles.icon}><MicIcon /></span>
          <div className={styles.sendBtn}><SendIcon /></div>
        </div>
      </div>
    </div>
  );
}
