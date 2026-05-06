import styles from './FormInputRow.module.css';

export function FormInputRow({
  label,
  placeholder,
  placeholderId,
  valueId,
  value,
}: {
  label: string;
  placeholder: string;
  placeholderId: string;
  valueId: string;
  value: string;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.field} id={`field-${valueId}`}>
        <span id={placeholderId} className={styles.placeholder}>{placeholder}</span>
        <span className={styles.valueWrap}>
          <span id={valueId} className={styles.value}>{value}</span>
          <span id={`caret-${valueId}`} className={styles.caret} aria-hidden="true" />
        </span>
        <span data-ring className={styles.ring} aria-hidden="true" />
      </div>
    </div>
  );
}
