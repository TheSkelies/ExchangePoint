import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import styles from "./CurrenciesPage.module.css";

function sanitizeCurrencyCode(value) {
    return String(value ?? "")
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase()
        .slice(0, 3);
}

export default function CurrenciesPage() {
    const [state, setState] = useState({
        loading: true,
        error: "",
        currencies: [],
        createOpen: false,
        code: "",
        submitting: false,
    });

    async function load() {
        setState((s) => ({ ...s, loading: true, error: "" }));
        try {
            const currencies = await api.getCurrencies();
            setState((s) => ({ ...s, loading: false, currencies }));
        } catch (e) {
            setState((s) => ({ ...s, loading: false, error: e?.message || "Ошибка загрузки" }));
        }
    }

    useEffect(() => {
        load();
    }, []);

    const sorted = useMemo(() => {
        return [...state.currencies].sort((a, b) => String(a.code).localeCompare(String(b.code)));
    }, [state.currencies]);

    function openModal() {
        setState((s) => ({ ...s, createOpen: true, code: "", error: "" }));
    }

    function closeModal() {
        setState((s) => ({ ...s, createOpen: false }));
    }

    const canSubmit = useMemo(() => {
        return !state.submitting && /^[A-Z]{3}$/.test(state.code);
    }, [state.submitting, state.code]);

    async function submit() {
        setState((s) => ({ ...s, error: "" }));
        if (!/^[A-Z]{3}$/.test(state.code)) {
            setState((s) => ({ ...s, error: "Введите код валюты из 3 заглавных букв (например, USD)" }));
            return;
        }

        try {
            setState((s) => ({ ...s, submitting: true }));
            await api.createCurrency({ name: state.code });
            setState((s) => ({ ...s, submitting: false, createOpen: false, code: "" }));
            await load();
        } catch (e) {
            setState((s) => ({ ...s, submitting: false, error: e?.message || "Не удалось добавить валюту" }));
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Валюты</h1>
                <button className={styles.primaryBtn} onClick={openModal}>
                    + Добавить валюту
                </button>
            </div>

            {state.error && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>Ошибка</div>
                    <div className={styles.alertText}>{state.error}</div>
                </div>
            )}

            <div className={styles.card}>
                <div className={styles.tableHead}>
                    <div>ID</div>
                    <div>Код</div>
                </div>

                {state.loading ? (
                    <div className={styles.loading}>Загрузка…</div>
                ) : (
                    <div className={styles.tableBody}>
                        {sorted.map((c) => (
                            <div className={styles.row} key={c.id}>
                                <div className={styles.mono}>#{c.id}</div>
                                <div className={styles.code}>{c.code}</div>
                            </div>
                        ))}
                    </div>
                )}

                {!state.loading && sorted.length === 0 && <div className={styles.empty}>Валют пока нет</div>}
            </div>

            {state.createOpen && (
                <div className={styles.modalOverlay} onMouseDown={closeModal} role="dialog" aria-modal="true">
                    <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Добавить валюту</div>

                        <label className={styles.field}>
                            <div className={styles.label}>Код (3 заглавные буквы)</div>
                            <input
                                className={styles.input}
                                placeholder="USD"
                                value={state.code}
                                onChange={(e) => setState((s) => ({ ...s, code: sanitizeCurrencyCode(e.target.value) }))}
                                disabled={state.submitting}
                            />
                        </label>

                        <div className={styles.modalActions}>
                            <button className={styles.primaryBtn} onClick={submit} disabled={!canSubmit}>
                                {state.submitting ? "Создание..." : "Создать"}
                            </button>
                            <button className={styles.secondaryBtn} onClick={closeModal} disabled={state.submitting}>
                                Отмена
                            </button>
                        </div>

                        <div className={styles.hint}>Пример: USD, EUR, RUB</div>
                    </div>
                </div>
            )}
        </div>
    );
}