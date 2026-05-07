import styles from './CaseCreatedCard.module.css';
import { CheckTickCircle } from '@/icons';

export function CaseCreatedCard({
  id,
  title = 'Case created',
  caseId,
}: {
  id?: string;
  title?: string;
  caseId: React.ReactNode;
}) {
  return (
    <div id={id} className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <span data-shimmer className={styles.shimmer} aria-hidden="true" />
        <CheckTickCircle />
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.caseId}>{caseId}</p>
      </div>
    </div>
  );
}
