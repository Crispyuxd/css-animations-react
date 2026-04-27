import styles from './QuantityStepper.module.css';
import { MinusIcon, PlusIcon } from '@/icons';

interface QuantityStepperProps {
  id?: string;
  qty: number;
}

export function QuantityStepper({ id, qty }: QuantityStepperProps) {
  return (
    <div id={id} className={styles.stepper}>
      <span className={styles.btn}><MinusIcon /></span>
      <span className={styles.qty}>{qty}</span>
      <span className={styles.btn}><PlusIcon /></span>
    </div>
  );
}
