import styles from './PaymentMethodsSheet.module.css';
import { CloseX, VisaLogo, MastercardLogo } from '@/icons';

interface Method {
  id?: string;
  brand: 'visa' | 'mastercard';
  last4: string;
  selected?: boolean;
}

export function PaymentMethodsSheet({
  id,
  confirmId,
  methods = [
    { brand: 'visa', last4: '2683', selected: true },
    { brand: 'mastercard', last4: '2573' },
    { brand: 'visa', last4: '4279' },
  ],
}: {
  id: string;
  confirmId?: string;
  methods?: Method[];
}) {
  return (
    <div id={id} className={styles.wrapper}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <p className={styles.title}>Payment methods</p>
          <span className={styles.close}><CloseX /></span>
        </div>

        <div className={styles.list}>
          {methods.map((m, i) => (
            <div key={i} id={m.id} className={styles.row}>
              <span className={`${styles.radio} ${m.selected ? styles.radioOn : ''}`} aria-hidden="true">
                {m.selected && <span className={styles.radioDot} />}
              </span>
              <span className={styles.cardLogo}>
                {m.brand === 'visa' ? <VisaLogo /> : <MastercardLogo />}
              </span>
              <span className={styles.cardNum}>•• {m.last4}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>Add new</button>
          <button id={confirmId} type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
            <span className={styles.btnLabel}>Confirm</span>
            <span data-ring className={styles.btnRing} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentMethodsOverlay({ id }: { id: string }) {
  return <div id={id} className={styles.overlay} />;
}
