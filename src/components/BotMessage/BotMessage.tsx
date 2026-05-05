import styles from './BotMessage.module.css';

type BotLine = string | { bullet: string } | { indent: string };

interface BotMessageProps {
  id: string;
  children?: string;
  lines?: BotLine[];
  meta?: React.ReactNode;
  slot?: React.ReactNode;
  /** Render text as per-word spans for word-fade reveal. Engine animates them. */
  wordMode?: boolean;
}

function renderWords(text: string, idPrefix: string, startIdx: number, className: string): { nodes: React.ReactNode[]; nextIdx: number } {
  const words = text.split(/\s+/).filter(Boolean);
  const nodes: React.ReactNode[] = [];
  let idx = startIdx;
  words.forEach((word, j) => {
    nodes.push(
      <span key={`w-${idx}`} id={`${idPrefix}-w-${idx}`} data-word className={className}>{word}</span>
    );
    if (j < words.length - 1) nodes.push(' ');
    idx += 1;
  });
  return { nodes, nextIdx: idx };
}

export function BotMessage({ id, children, lines, meta, slot, wordMode }: BotMessageProps) {
  return (
    <div className={styles.botBlock}>
      {lines ? (
        <p id={id} className={`${styles.msg} ${wordMode ? styles.botMsgWords : styles.botMsg}`}>
          {(() => {
            let wordIdx = 1;
            return lines.map((line, i) => {
              const lineId = `${id}-line-${i + 1}`;
              if (typeof line === 'string') {
                if (wordMode) {
                  const r = renderWords(line, id, wordIdx, styles.word);
                  wordIdx = r.nextIdx;
                  return <span key={i} className={styles.wordLine}>{r.nodes}</span>;
                }
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
            });
          })()}
        </p>
      ) : wordMode && children ? (
        <p id={id} className={`${styles.msg} ${styles.botMsgWords}`}>
          {renderWords(children, id, 1, styles.word).nodes}
        </p>
      ) : (
        <p id={id} className={`${styles.msg} ${styles.botMsg}`}>{children}</p>
      )}
      {slot && <div className={styles.slot}>{slot}</div>}
      {meta}
    </div>
  );
}
