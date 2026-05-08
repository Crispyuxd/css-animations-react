import styles from './PlanPickerCard.module.css';
import { ChevronLeft, ChevronDown } from '@/icons';

interface Plan { name: string; price: string; selectId?: string; }

export function PlanPickerCard({
  id,
  confirmId,
  plans = [
    { name: 'Free', price: '0.00 USD /m' },
    { name: 'Standard', price: '150.00 USD /m' },
    { name: 'Pro', price: '500.00 USD /m' },
  ],
}: {
  id?: string;
  confirmId?: string;
  plans?: Plan[];
}) {
  return (
    <div id={id} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.chevron}><ChevronLeft /></span>
        <p className={styles.title}>Update Hobby plan</p>
      </div>
      <div className={styles.divider} />

      <div className={styles.dropdownWrap}>
        <div className={styles.dropdown}>
          <span className={styles.dropdownLabel}>Monthly</span>
          <span className={styles.dropdownChevron}><ChevronDown /></span>
        </div>
      </div>

      <div className={styles.planList}>
        {plans.map((p, i) => (
          <div key={p.name}>
            {i > 0 && <div className={styles.dividerInset} />}
            <div className={styles.planRow}>
              <div className={styles.planInfo}>
                <span className={styles.planName}>{p.name}</span>
                <span className={styles.planPrice}>{p.price}</span>
              </div>
              <button id={p.selectId} type="button" className={styles.selectBtn}>
                <span data-label-default className={styles.selectLabel}>Select</span>
                <span data-label-selected className={`${styles.selectLabel} ${styles.selectLabelSelected}`}>Selected</span>
                <span data-ring className={styles.selectRing} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button id={confirmId} type="button" className={styles.confirmBtn}>
          <span className={styles.btnLabel}>Confirm</span>
        </button>
      </div>
    </div>
  );
}
