import { Fragment } from 'react';
import styles from './PickerWidget.module.css';
import { ChevronLeft } from '@/icons';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';

export interface PickerProduct {
  id?: string;
  name: string;
  price: string;
  imageSrc: string;
  buttonId?: string;
  qtyId?: string;
}

interface PickerWidgetProps {
  id: string;
  category: string;
  products: PickerProduct[];
  scroller?: { top: number };
  children?: React.ReactNode;
}

export function PickerWidget({ id, category, products, scroller, children }: PickerWidgetProps) {
  return (
    <div id={id} className={styles.widget}>
      {children}
      {scroller && <div className={styles.scroller} style={{ top: scroller.top }} />}
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.chevron}><ChevronLeft /></span>
          <p className={styles.title}>{category}</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.products}>
          {products.map((p, i) => (
            <Fragment key={i}>
              {i > 0 && <div className={styles.divider} />}
              <div id={p.id} className={styles.product}>
                <div className={styles.image}>
                  <img src={p.imageSrc} alt="" />
                </div>
                <div className={styles.body}>
                  <div className={styles.info}>
                    <p className={styles.name}>{p.name}</p>
                    <p className={styles.price}>{p.price}</p>
                  </div>
                  <div className={styles.actionSlot}>
                    <button id={p.buttonId} className={styles.button} type="button">
                      Select options
                    </button>
                    {p.qtyId && (
                      <div className={styles.qtyOverlay}>
                        <QuantityStepper id={p.qtyId} qty={1} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
