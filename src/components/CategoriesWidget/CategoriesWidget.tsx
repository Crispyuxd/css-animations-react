import styles from './CategoriesWidget.module.css';

export interface CategoryItem {
  id?: string;
  buttonId?: string;
  title: string[];
  height: number;
  imageSrc: string;
}

interface CategoriesWidgetProps {
  id: string;
  items: CategoryItem[];
  scroller?: { top: number };
  children?: React.ReactNode;
}

export function CategoriesWidget({ id, items, scroller, children }: CategoriesWidgetProps) {
  return (
    <div id={id} className={styles.widget}>
      {children}
      <div className={styles.inner}>
        {scroller && (
          <div className={styles.scroller} style={{ top: scroller.top }} />
        )}
        <div className={styles.list}>
          {items.map((item, i) => (
            <div key={i} id={item.id} className={styles.card} style={{ height: item.height }}>
              <div className={styles.imageBox}>
                <img src={item.imageSrc} alt="" className={styles.image} />
                <div className={styles.rating}>
                  <span className={`${styles.dot} ${styles.active}`} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
              <div className={styles.body}>
                <div className={styles.titleStack}>
                  {item.title.map((line, j) => (
                    <p key={j} className={styles.title}>{line}</p>
                  ))}
                </div>
                <button id={item.buttonId} className={styles.button} type="button">View products</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
