import styles from './FormTextareaRow.module.css';

export function FormTextareaRow({
  label,
  placeholder,
  placeholderId,
  valueId,
  valueLines,
}: {
  label: string;
  placeholder: string;
  placeholderId: string;
  valueId: string;
  valueLines: string[];
}) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.field} id={`field-${valueId}`}>
        <span id={placeholderId} className={styles.placeholder}>{placeholder}</span>
        <p id={valueId} className={styles.value}>
          {valueLines.map((line, i) => (
            <span key={i} className={styles.lineWrap}>
              <span id={`${valueId}-line-${i + 1}`} className={styles.line}>{line}</span>
              <span id={`caret-${valueId}-line-${i + 1}`} className={styles.caret} aria-hidden="true" />
            </span>
          ))}
        </p>
        <span data-ring className={styles.ring} aria-hidden="true" />
      </div>
    </div>
  );
}
