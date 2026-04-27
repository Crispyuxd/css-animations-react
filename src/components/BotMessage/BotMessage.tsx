import styles from './BotMessage.module.css';

interface BotMessageProps {
  id: string;
  children?: string;
  lines?: string[];
  meta?: React.ReactNode;
}

export function BotMessage({ id, children, lines, meta }: BotMessageProps) {
  return (
    <div className={styles.botBlock}>
      {lines ? (
        <p id={id} className={`${styles.msg} ${styles.botMsg}`}>
          {lines.map((line, i) => (
            <span key={i} id={`${id}-line-${i + 1}`} className={styles.twLine}>{line}</span>
          ))}
        </p>
      ) : (
        <p id={id} className={`${styles.msg} ${styles.botMsg}`}>{children}</p>
      )}
      {meta}
    </div>
  );
}
