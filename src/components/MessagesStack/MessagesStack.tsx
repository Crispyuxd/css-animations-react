import styles from './MessagesStack.module.css';

export function MessagesStack({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.messages}>
      <div className={`${styles.messagesStack} messagesStack`}>{children}</div>
    </div>
  );
}
