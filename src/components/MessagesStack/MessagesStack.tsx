import styles from './MessagesStack.module.css';

export function MessagesStack({ children, gap }: { children: React.ReactNode; gap?: number }) {
  return (
    <div className={styles.messages}>
      <div
        className={`${styles.messagesStack} messagesStack`}
        style={gap !== undefined ? { gap } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
