import styles from './OrderSuccessWidget.module.css';
import { CheckCircleIcon } from '@/icons';

interface OrderSuccessWidgetProps {
  id: string;
  title?: string;
  subtitle: string;
}

export function OrderSuccessWidget({
  id,
  title = 'Order successfully placed',
  subtitle,
}: OrderSuccessWidgetProps) {
  return (
    <div id={id} className={styles.card}>
      <div className={styles.checkIcon}>
        <CheckCircleIcon />
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
