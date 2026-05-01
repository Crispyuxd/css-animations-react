import styles from './AttachmentItem.module.css';
import { ImageIcon, FileIcon, CancelX } from '@/icons';

export function AttachmentItem({
  id,
  filename,
  type,
}: {
  id?: string;
  filename: string;
  type: 'image' | 'file';
}) {
  return (
    <div id={id} className={styles.item}>
      <span className={styles.icon} aria-hidden="true">
        {type === 'image' ? <ImageIcon /> : <FileIcon />}
      </span>
      <span className={styles.name}>{filename}</span>
      <span className={styles.close} aria-label="Remove attachment"><CancelX /></span>
    </div>
  );
}
