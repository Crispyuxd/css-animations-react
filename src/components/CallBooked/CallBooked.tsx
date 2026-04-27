import styles from './CallBooked.module.css';
import { CheckCircleIcon } from '@/icons';

export function CallBooked({ id, title = 'Call booked', date }: { id: string; title?: string; date: string }) {
  return (
    <div id={id} className={styles.card}>
      <div className={styles.checkIcon}><CheckCircleIcon /></div>
      <div className={styles.details}>
        <div className={styles.title}>{title}</div>
        <div className={styles.date}>{date}</div>
      </div>
    </div>
  );
}
