import styles from "./RateCardSkeleton.module.css";

export default function RateCardSkeleton() {
    return (
        <div className={styles.card} aria-busy="true" aria-label="Loading">
            <div className={styles.row}>
                <div className={`${styles.block} ${styles.badge}`} />
                <div className={styles.mid}>
                    <div className={`${styles.block} ${styles.line1}`} />
                    <div className={`${styles.block} ${styles.line2}`} />
                </div>
                <div className={`${styles.block} ${styles.pill}`} />
            </div>
        </div>
    );
}