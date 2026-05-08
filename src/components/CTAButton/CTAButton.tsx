import styles from './CTAButton.module.css';

export function CTAButton({ id, block, children }: { id?: string; block?: boolean; children: string }) {
  return (
    <button id={id} type="button" className={`${styles.btn} ${block ? styles.block : ''}`}>
      <span className={styles.label}>{children}</span>
    </button>
  );
}
