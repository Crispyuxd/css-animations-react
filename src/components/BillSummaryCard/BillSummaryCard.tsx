import styles from './BillSummaryCard.module.css';
import { ChevronLeft, ChevronDown, VisaLogo } from '@/icons';

export function BillSummaryCard({
  id,
  payRowId,
  payChevronId,
  confirmId,
}: {
  id?: string;
  payRowId?: string;
  payChevronId?: string;
  confirmId?: string;
}) {
  return (
    <div id={id} className={styles.card}>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.chevron}><ChevronLeft /></span>
          <p className={styles.title}>Bill summary</p>
        </div>
        <div className={styles.divider} />

        <div className={styles.lines}>
          <div className={styles.line}>
            <div className={styles.lineLeft}>
              <span className={styles.lineLabel}>Prorated credit:</span>
              <span className={styles.lineSub}>Hobby plan</span>
            </div>
            <span className={styles.lineAmount}>-16.00 USD</span>
          </div>
          <div className={styles.line}>
            <div className={styles.lineLeft}>
              <span className={styles.lineLabel}>Prorated charge:</span>
              <span className={styles.lineSub}>Standard plan</span>
            </div>
            <span className={styles.lineAmount}>134.00 USD</span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total due:</span>
          <span className={styles.totalAmount}>134.00 USD</span>
        </div>
      </div>

      <div className={styles.footer}>
        <div id={payRowId} className={styles.payRow}>
          <span className={styles.payLabel}>Pay using</span>
          <div className={styles.payValue}>
            <span className={styles.cardLogo}><VisaLogo /></span>
            <span className={styles.cardNum}>•• 2683</span>
            <span id={payChevronId} className={styles.payChevron}><ChevronDown /></span>
          </div>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`}>Cancel plan</button>
          <button id={confirmId} type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
            <span className={styles.btnLabel}>Confirm</span>
            <span data-ring className={styles.btnRing} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
