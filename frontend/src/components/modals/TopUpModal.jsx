import { useEffect, useMemo, useState } from "react";
import styles from "./TopUpModal.module.css";
import { sanitizeAmountInput, toNumberFromInput } from "../../utils/moneyInput.js";
import { api } from "../../services/api.js"; // NEW

function sanitizeDigits(value, maxLen) {
    return String(value ?? "").replace(/\D/g, "").slice(0, maxLen);
}

function sanitizeExp(value) {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidExp(mmYY) {
    if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false;
    const [mm] = mmYY.split("/");
    const m = Number(mm);
    return m >= 1 && m <= 12;
}

export default function TopUpModal({ open, onClose, currencies, savedCard, onSubmit }) {
    const [amountInput, setAmountInput] = useState("");
    const [currencyId, setCurrencyId] = useState("");
    const [pan, setPan] = useState("");
    const [exp, setExp] = useState("");
    const [cvc, setCvc] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [loadingSavedCard, setLoadingSavedCard] = useState(false); // NEW

    useEffect(() => {
        if (!open) return;
        if (!currencyId && currencies?.length) setCurrencyId(String(currencies[0].id));
    }, [open, currencies, currencyId]);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e) {
            if (e.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const canSubmit = useMemo(() => {
        const amount = toNumberFromInput(amountInput);
        return (
            Number.isFinite(amount) &&
            amount > 0 &&
            currencyId &&
            /^\d{12}$/.test(pan) &&
            isValidExp(exp) &&
            /^\d{3,4}$/.test(cvc) &&
            !submitting
        );
    }, [amountInput, currencyId, pan, exp, cvc, submitting]);

    async function loadSavedCard() {
        setError("");

        try {
            if (savedCard) {
                setPan(String(savedCard.pan ?? "").replace(/\D/g, "").slice(0, 12));
                setExp(String(savedCard.exp ?? "").trim());
                if (savedCard.cvc) setCvc(String(savedCard.cvc ?? "").replace(/\D/g, "").slice(0, 4));
                return;
            }

            setLoadingSavedCard(true);
            const resp = await api.getMyCard();

            const serverPan = String(resp?.card_number ?? "").replace(/\D/g, "").slice(0, 12);
            const serverExp = String(resp?.card_expiry ?? "").trim();

            if (!serverPan && !serverExp) {
                setError("У пользователя нет сохранённых данных карты");
                return;
            }

            if (serverPan) setPan(serverPan);
            if (serverExp) setExp(serverExp);
        } catch (e) {
            setError(e?.message || "Не удалось загрузить данные карты");
        } finally {
            setLoadingSavedCard(false);
        }
    }

    async function handleSubmit() {
        setError("");
        const amount = toNumberFromInput(amountInput);

        try {
            setSubmitting(true);
            await onSubmit?.({
                amount,
                currency_id: Number(currencyId),
                card: { pan, exp, cvc },
            });

            setAmountInput("");
            setPan("");
            setExp("");
            setCvc("");
            setSubmitting(false);
            onClose?.();
        } catch (e) {
            setSubmitting(false);
            setError(e?.message || "Ошибка пополнения");
        }
    }

    if (!open) return null;

    const loadDisabled = submitting || loadingSavedCard;

    return (
        <div className={styles.backdrop} onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>Пополнить баланс</div>
                    <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {error && (
                    <div className={styles.alert}>
                        <div className={styles.alertTitle}>Ошибка</div>
                        <div className={styles.alertText}>{error}</div>
                    </div>
                )}

                <div className={styles.form}>
                    <label className={styles.field}>
                        <div className={styles.label}>Сумма</div>
                        <input
                            className={styles.input}
                            inputMode="decimal"
                            placeholder="0"
                            value={amountInput}
                            onChange={(e) => setAmountInput(sanitizeAmountInput(e.target.value))}
                            disabled={submitting}
                        />
                    </label>

                    <label className={styles.field}>
                        <div className={styles.label}>Валюта</div>
                        <select
                            className={styles.select}
                            value={currencyId}
                            onChange={(e) => setCurrencyId(e.target.value)}
                            disabled={submitting}
                        >
                            {currencies?.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className={styles.cardBox}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>Данные карты</div>
                            <button
                                type="button"
                                className={styles.loadBtn}
                                onClick={loadSavedCard}
                                disabled={loadDisabled}
                                title="Подставить из профиля"
                            >
                                {loadingSavedCard ? "Загрузка..." : "Загрузить"}
                            </button>
                        </div>

                        <label className={styles.field}>
                            <div className={styles.label}>PAN (12 цифр)</div>
                            <input
                                className={styles.input}
                                inputMode="numeric"
                                placeholder="000000000000"
                                value={pan}
                                onChange={(e) => setPan(sanitizeDigits(e.target.value, 12))}
                                disabled={submitting}
                            />
                        </label>

                        <div className={styles.row}>
                            <label className={styles.field}>
                                <div className={styles.label}>Срок (MM/YY)</div>
                                <input
                                    className={styles.input}
                                    inputMode="numeric"
                                    placeholder="MM/YY"
                                    value={exp}
                                    onChange={(e) => setExp(sanitizeExp(e.target.value))}
                                    disabled={submitting}
                                />
                            </label>

                            <label className={styles.field}>
                                <div className={styles.label}>cvc</div>
                                <input
                                    className={styles.input}
                                    inputMode="numeric"
                                    placeholder="000"
                                    value={cvc}
                                    onChange={(e) => setCvc(sanitizeDigits(e.target.value, 4))}
                                    disabled={submitting}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <button className={styles.submitBtn} type="button" onClick={handleSubmit} disabled={!canSubmit}>
                    {submitting ? "Подтверждение..." : "Подтвердить"}
                </button>

                <div className={styles.hint}>Данные карты используются только для текущей операции.</div>
            </div>
        </div>
    );
}