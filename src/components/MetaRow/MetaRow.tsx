import styles from './MetaRow.module.css';
import { ThumbsUp, ThumbsDown } from '@/icons';

interface MetaRowProps {
  id: string;
  author?: string;
  timestamp?: string;
  positioned?: boolean;
  gap?: number;
}

export function MetaRow({ id, author, timestamp = 'Just now', positioned = true, gap }: MetaRowProps) {
  return (
    <div id={id}
         className={`${styles.meta} ${positioned ? styles.positioned : ''}`}
         style={gap !== undefined ? { marginTop: gap } : undefined}>
      {author ? (
        <span className={styles.authorGroup}>
          <span className={styles.author}>{author}</span>
          <span className={styles.dotSep}>&bull;</span>
          <span className={styles.timestamp}>{timestamp}</span>
        </span>
      ) : (
        <span className={styles.timestamp}>{timestamp}</span>
      )}
      <span className={styles.divider} aria-hidden="true" />
      <span className={styles.reaction} role="button" aria-label="Thumbs up"><ThumbsUp /></span>
      <span className={styles.reaction} role="button" aria-label="Thumbs down"><ThumbsDown /></span>
    </div>
  );
}
