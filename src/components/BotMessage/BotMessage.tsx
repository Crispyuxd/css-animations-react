import styles from './BotMessage.module.css';

type BotLine = string | { bullet: string } | { indent: string };

interface BotMessageProps {
  id: string;
  children?: string;
  lines?: BotLine[];
  meta?: React.ReactNode;
  slot?: React.ReactNode;
}

export function BotMessage({ id, children, lines, meta, slot }: BotMessageProps) {
  return (
    <div className={styles.botBlock}>
      {lines ? (
        <p id={id} className={`${styles.msg} ${styles.botMsg}`}>
          {lines.map((line, i) => {
            const lineId = `${id}-line-${i + 1}`;
            if (typeof line === 'string') {
              return <span key={i} id={lineId} className={styles.twLine}>{line}</span>;
            }
            if ('bullet' in line) {
              return (
                <span key={i} id={lineId} className={`${styles.twLine} ${styles.bulletLine}`}>
                  <span className={styles.bulletMarker} aria-hidden="true">•</span>
                  <span>{line.bullet}</span>
                </span>
              );
            }
            return (
              <span key={i} id={lineId} className={`${styles.twLine} ${styles.indentLine}`}>{line.indent}</span>
            );
          })}
        </p>
      ) : (
        <p id={id} className={`${styles.msg} ${styles.botMsg}`}>{children}</p>
      )}
      {slot && <div className={styles.slot}>{slot}</div>}
      {meta}
    </div>
  );
}
