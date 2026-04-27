import styles from './CalendarWidget.module.css';
import { ChevronLeft, ChevronRight } from '@/icons';

interface DayCell { num: number; name: string; id?: string }
interface TimeSlotRow { slots: { label: string; id?: string }[] }

interface CalendarWidgetProps {
  id: string;
  days: DayCell[];
  timeRows: TimeSlotRow[];
  children?: React.ReactNode;
}

export function CalendarWidget({ id, days, timeRows, children }: CalendarWidgetProps) {
  return (
    <div id={id} className={styles.widget}>
      <div className={styles.dates}>
        <span className={styles.chevron}><ChevronLeft /></span>
        <div className={styles.days}>
          {days.map((d) => (
            <div key={d.num} id={d.id} className={styles.dayCell}>
              <span className={styles.dayNum}>{d.num}</span>
              <span className={styles.dayName}>{d.name}</span>
            </div>
          ))}
        </div>
        <span className={`${styles.chevron} ${styles.chevronRight}`}><ChevronRight /></span>
      </div>
      <div className={styles.divider} />
      <div className={styles.times}>
        {timeRows.map((row, i) => (
          <div key={i} className={styles.timeRow}>
            {row.slots.map((slot) => (
              <div key={slot.label} id={slot.id} className={styles.timeSlot}>{slot.label}</div>
            ))}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
