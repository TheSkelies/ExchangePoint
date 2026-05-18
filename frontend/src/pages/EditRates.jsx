import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import styles from "./EditRates.module.css";

export default function EditRates() {
    const [state, setState] = useState({
        loading: true,
        error: "",
        rates: [],
        currencies: [],
        editingId: null,
        editingValue: "",
        // NEW: modal state
        createOpen: false,
        createSellId: "",
        createBuyId: "",
        createRate: "",
    });

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setState((s) => ({ ...s, loading: true, error: "" }));

                const [rates, currencies] = await Promise.all([
                    api.getExchangeRatesAll(),
                    api.getCurrencies(),
                ]);

                if (cancelled) return;

                setState((s) => ({
                    ...s,
                    loading: false,
                    rates,
                    currencies,
                    // дефолты для модалки
                    createSellId: currencies?.[0]?.id ? String(currencies[0].id) : "",
                    createBuyId: currencies?.[1]?.id ? String(currencies[1].id) : "",
                }));
            } catch (e) {
                if (cancelled) return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: e?.message || "Ошибка загрузки",
                }));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const currencyById = useMemo(() => {
        const m = new Map();
        for (const c of state.currencies) m.set(c.id, c);
        return m;
    }, [state.currencies]);

    async function reloadRates() {
        const rates = await api.getExchangeRatesAll();
        setState((s) => ({ ...s, rates }));
    }

    function startEdit(r) {
        setState((s) => ({
            ...s,
            editingId: r.id,
            editingValue: String(r.rate ?? ""),
            error: "",
        }));
    }

    function cancelEdit() {
        setState((s) => ({ ...s, editingId: null, editingValue: "" }));
    }

    async function saveEdit(id) {
        const value = String(state.editingValue).replace(",", ".");
        const num = Number(value);

        if (!Number.isFinite(num) || num <= 0) {
            setState((s) => ({ ...s, error: "Введите корректный курс (число больше 0)" }));
            return;
        }

        await api.updateRate({ id, rate: value });
        await reloadRates();
        cancelEdit();
    }

    async function softDelete(id) {
        if (!confirm("Сделать курс неактивным (мягкое удаление)?")) return;
        await api.deleteRateSoft(id);
        await reloadRates();
    }

    function openCreateModal() {
        setState((s) => ({
            ...s,
            error: "",
            createOpen: true,
            createRate: "",
            createSellId: s.createSellId || (s.currencies?.[0]?.id ? String(s.currencies[0].id) : ""),
            createBuyId:
                s.createBuyId ||
                (s.currencies?.[1]?.id ? String(s.currencies[1].id) : s.currencies?.[0]?.id ? String(s.currencies[0].id) : ""),
        }));
    }

    function closeCreateModal() {
        setState((s) => ({ ...s, createOpen: false }));
    }

    async function submitCreate() {
        const sellId = Number(state.createSellId);
        const buyId = Number(state.createBuyId);
        const rateStr = String(state.createRate).replace(",", ".");
        const rateNum = Number(rateStr);

        if (!sellId || !buyId) {
            setState((s) => ({ ...s, error: "Выберите валюты" }));
            return;
        }
        if (sellId === buyId) {
            setState((s) => ({ ...s, error: "Валюты должны быть разными" }));
            return;
        }
        if (!Number.isFinite(rateNum) || rateNum <= 0) {
            setState((s) => ({ ...s, error: "Введите корректный курс (число больше 0)" }));
            return;
        }

        await api.createRate({
            sell_currency_id: sellId,
            buy_currency_id: buyId,
            rate: rateStr,
        });

        await reloadRates();
        closeCreateModal();
    }

    if (state.loading) return <div className={styles.page}>Загрузка…</div>;

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Редактирование курсов</h1>

                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateModal}>
                    + Добавить курс
                </button>
            </div>

            {state.error && <div className={styles.alert}>{state.error}</div>}

            <div className={styles.list}>
                {state.rates.map((r) => {
                    const sell = currencyById.get(r.sell_currency_id)?.code ?? `#${r.sell_currency_id}`;
                    const buy = currencyById.get(r.buy_currency_id)?.code ?? `#${r.buy_currency_id}`;
                    const isEditing = state.editingId === r.id;
                    const isActive = r.is_active !== false;

                    return (
                        <div
                            key={r.id}
                            className={`${styles.card} ${!isActive ? styles.cardInactive : ""}`}
                        >
                            <div className={styles.left}>
                                <div className={styles.pair}>
                                    #{r.id} — {sell} → {buy}
                                    {!isActive && <span className={styles.inactiveBadge}>неактивен</span>}
                                </div>

                                {!isEditing ? (
                                    <div className={styles.rateRow}>
                                        Курс: {Number(r.rate).toLocaleString("ru-RU", { maximumFractionDigits: 8 })}
                                    </div>
                                ) : (
                                    <div className={styles.rateRow}>
                                        <span>Курс:</span>
                                        <input
                                            className={styles.input}
                                            value={state.editingValue}
                                            onChange={(e) => setState((s) => ({ ...s, editingValue: e.target.value }))}
                                            inputMode="decimal"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.actions}>
                                {!isEditing ? (
                                    <>
                                        <button
                                            className={styles.btn}
                                            onClick={() => startEdit(r)}
                                            disabled={!isActive}
                                        >
                                            Редактировать
                                        </button>

                                        <button
                                            className={`${styles.btn} ${styles.btnDanger}`}
                                            onClick={() => softDelete(r.id)}
                                            disabled={!isActive}
                                        >
                                            Удалить
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                            onClick={() => saveEdit(r.id)}
                                        >
                                            Сохранить
                                        </button>

                                        <button
                                            className={`${styles.btn} ${styles.btnSecondary}`}
                                            onClick={cancelEdit}
                                        >
                                            Отмена
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: create rate */}
            {state.createOpen && (
                <div className={styles.modalOverlay} onMouseDown={closeCreateModal} role="dialog" aria-modal="true">
                    <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Добавить курс</div>

                        <div className={styles.modalGrid}>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Продаём</span>
                                <select
                                    className={styles.select}
                                    value={state.createSellId}
                                    onChange={(e) => setState((s) => ({ ...s, createSellId: e.target.value }))}
                                >
                                    {state.currencies.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.code}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Покупаем</span>
                                <select
                                    className={styles.select}
                                    value={state.createBuyId}
                                    onChange={(e) => setState((s) => ({ ...s, createBuyId: e.target.value }))}
                                >
                                    {state.currencies.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.code}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className={styles.field} style={{ gridColumn: "1 / -1" }}>
                                <span className={styles.fieldLabel}>Курс</span>
                                <input
                                    className={styles.input}
                                    value={state.createRate}
                                    onChange={(e) => setState((s) => ({ ...s, createRate: e.target.value }))}
                                    inputMode="decimal"
                                    placeholder="например 16.45"
                                />
                            </label>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitCreate}>
                                Создать
                            </button>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeCreateModal}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}