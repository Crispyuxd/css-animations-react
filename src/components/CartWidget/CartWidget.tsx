import styles from './CartWidget.module.css';
import { VisaLogo, ChevronDown } from '@/icons';

export interface CartItem {
  id?: string;
  name: string;
  price: string;
  qty?: number;
  imageSrc: string;
}

interface CartWidgetProps {
  id: string;
  items: CartItem[];
  totalLabel?: string;
  total: string;
  payment: { label: string; brand: string; last4: string };
  checkoutId?: string;
  children?: React.ReactNode;
}

export function CartWidget({
  id,
  items,
  totalLabel = 'Total due:',
  total,
  payment,
  checkoutId,
  children,
}: CartWidgetProps) {
  return (
    <div id={id} className={styles.widget}>
      <div className={styles.top}>
        <p className={styles.heading}>{items.length} items in cart</p>
        <div className={styles.divider} />
        <div className={styles.lines}>
          {items.map((item, i) => (
            <div key={item.id ?? i} id={item.id} className={styles.line}>
              <div className={styles.lineLeft}>
                <div className={styles.thumb}>
                  <img src={item.imageSrc} alt="" className={styles.thumbImg} />
                </div>
                <div className={styles.lineText}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemSub}>Men&rsquo;s Workout Shoes</p>
                </div>
              </div>
              <p className={styles.itemPrice}>{item.price}</p>
            </div>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.totalRow}>
          <p className={styles.totalLabel}>{totalLabel}</p>
          <p className={styles.totalValue}>{total}</p>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.payRow}>
          <p className={styles.payLabel}>{payment.label}</p>
          <div className={styles.payRight}>
            <span className={styles.visa}><VisaLogo /></span>
            <p className={styles.payCard}>&bull;&bull; {payment.last4}</p>
            <span className={styles.chev}><ChevronDown /></span>
          </div>
        </div>
        <button id={checkoutId} type="button" className={styles.checkout}>
          Checkout
        </button>
      </div>
      {children}
    </div>
  );
}
