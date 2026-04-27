import styles from './ProductSheet.module.css';
import { CloseX, ChevronDown, ShoppingCart } from '@/icons';

interface ProductSheetProps {
  id: string;
  title: string;
  size: string;
  color: string;
  total: string;
  buttonId?: string;
  children?: React.ReactNode;
}

export function ProductSheet({ id, title, size, color, total, buttonId, children }: ProductSheetProps) {
  return (
    <div id={id} className={styles.wrapper}>
      {children}
      <div className={styles.sheet}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <p className={styles.title}>{title}</p>
            <span className={styles.close}><CloseX /></span>
          </div>
          <div className={styles.body}>
            <Field label="Size" value={size} />
            <Field label="Color" value={color} />
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total amount</span>
              <span className={styles.totalAmount}>{total}</span>
            </div>
            <button id={buttonId} className={styles.addToCart} type="button">
              <span className={styles.cartIcon}><ShoppingCart /></span>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldOuter}>
        <div className={styles.fieldInner}>
          <span className={styles.fieldValue}>{value}</span>
          <span className={styles.fieldChevron}><ChevronDown /></span>
        </div>
      </div>
    </div>
  );
}

export function SheetOverlay({ id }: { id: string }) {
  return <div id={id} className={styles.overlay} />;
}
