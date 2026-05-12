import styles from "./RateCard.module.css";

export default function RateCard({ from, to, rateText, subtitle, accent = "blue" }) {
    const accentClass = accent === "pink" ? styles.pink : styles.blue;

    return (
        <article className={styles.card}>
            <div className={styles.row}>
                <div className={`${styles.badge} ${accentClass}`} aria-hidden="true">
                    $
                </div>

                <div className={styles.pair}>
                    <div className={styles.codes}>
                        <span className={styles.code}>{from}</span>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.code}>{to}</span>
                    </div>
                    <div className={styles.subtitle}>{subtitle}</div>
                </div>

                <div className={styles.ratePill}>{rateText}</div>
            </div>
        </article>
    );
}