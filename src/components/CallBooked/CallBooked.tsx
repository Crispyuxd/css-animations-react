import styles from './CallBooked.module.css';
import { CheckCircleIcon } from '@/icons';

export function CallBooked({ id, title = 'Call booked', date }: { id: string; title?: string; date: string }) {
  return (
    <div id={id} className={styles.card}>
      <span className={styles.checkIcon}>
        <span data-shimmer className={styles.shimmer} aria-hidden="true" />
        <CheckCircleIcon />
      </span>
      <div className={styles.details}>
        <div className={styles.title}>{title}</div>
        <div className={styles.date}>{date}</div>
      </div>
    </div>
  );
}
