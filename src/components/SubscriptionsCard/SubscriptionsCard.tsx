import styles from './SubscriptionsCard.module.css';
import { RefreshIcon, InfoCircleIcon } from '@/icons';

export function SubscriptionsCard({ id, updateButtonId }: { id?: string; updateButtonId?: string }) {
  return (
    <div id={id} className={styles.card}>
      <div className={styles.body}>
        <h3 className={styles.title}>Your subscriptions</h3>
        <div className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.row}>
            <div className={styles.planName}>
              <span className={styles.planLabel}>Hobby</span>
              <span className={styles.tag}>+2</span>
            </div>
          </div>
          <span className={styles.price}>40.00 USD /m</span>
          <div className={styles.renewRow}>
            <span className={styles.icon20}><RefreshIcon /></span>
            <span className={styles.renewText}>Renews on April 12, 2026</span>
          </div>
          <div className={styles.actionRow}>
            <button type="button" className={`${styles.btn} ${styles.btnDanger}`}>Cancel plan</button>
            <button id={updateButtonId} type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
              <span className={styles.btnLabel}>Update plan</span>
            </button>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <span className={styles.planLabel}>Message credits</span>
          <span className={styles.price}>40.00 USD /m</span>
          <div className={styles.renewRow}>
            <span className={styles.icon20}><RefreshIcon /></span>
            <span className={styles.renewText}>Renews on April 12, 2026</span>
          </div>
          <div className={styles.notice}>
            <span className={styles.icon16}><InfoCircleIcon /></span>
            <span className={styles.noticeText}>Plan changes are not available</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>Need a new subscription?</span>
        <button type="button" className={styles.footerBtn}>Create</button>
      </div>
    </div>
  );
}
