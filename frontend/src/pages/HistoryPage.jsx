import { useEffect, useMemo, useState } from "react";
import styles from "./HistoryPage.module.css";
import { api } from "../services/api.js";
import { formatDateTime } from "../utils/format.js";

function HistoryRowSkeleton() {
    return (
        <div className={styles.skelRow} aria-busy="true">
            <div className={`${styles.skel} ${styles.skelShort}`} />
            <div className={`${styles.skel} ${styles.skelMid}`} />
            <div className={`${styles.skel} ${styles.skelLong}`} />
        </div>
    );
}

export default function HistoryPage() {
    const [state, setState] = useState({
        loading: true,
        error: "",
        currencies: [],
        operations: [],
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setState((s) => ({ ...s, loading: true, error: "" }));
            try {
                const [currencies, operations] = await Promise.all([
                    api.getCurrencies(),
                    api.getMyOperations(),
                ]);
                if (cancelled) return;
                setState({ loading: false, error: "", currencies, operations });
            } catch (e) {
                if (cancelled) return;
                setState((s) => ({ ...s, loading: false, error: e?.message || "Ошибка загрузки" }));
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const currencyById = useMemo(() => {
        const map = new Map();
        for (const c of state.currencies) map.set(c.id, c);
        return map;
    }, [state.currencies]);

    return (
        <div className={styles.page}>
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>История операций</h1>
                    <div className={styles.subtitle}>Последние операции пользователя</div>
                </div>
            </div>

            {state.error && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>Не удалось загрузить историю</div>
                    <div className={styles.alertText}>{state.error}</div>
                </div>
            )}

            <section className={styles.table}>
                <div className={styles.tableHead}>
                    <div>ID</div>
                    <div>Тип</div>
                    <div>Дата</div>
                </div>

                {state.loading ? (
                    <div className={styles.tableBody}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <HistoryRowSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.tableBody}>
                        {state.operations.map((op) => (
                            <div className={styles.row} key={op.id}>
                                <div className={styles.mono}>#{op.id}</div>
                                <div className={styles.typePill}>{op.operation_type}</div>
                                <div className={styles.muted}>{formatDateTime(op.created_at)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {!state.loading && state.operations.length === 0 && (
                <div className={styles.empty}>Пока нет операций</div>
            )}

            <div style={{ display: "none" }}>{currencyById.size}</div>
        </div>
    );
}