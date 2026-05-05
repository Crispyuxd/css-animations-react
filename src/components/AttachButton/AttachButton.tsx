import styles from './AttachButton.module.css';
import { AttachIcon } from '@/icons';

export function AttachButton({ id, children = 'Add attachment' }: { id?: string; children?: string }) {
  return (
    <button id={id} type="button" className={styles.btn}>
      <span className={styles.icon} aria-hidden="true"><AttachIcon /></span>
      <span className={styles.label}>{children}</span>
      <span data-ring className={styles.ring} aria-hidden="true" />
    </button>
  );
}
