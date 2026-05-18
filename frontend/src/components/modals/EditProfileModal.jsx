import { useEffect, useMemo, useState } from "react";
import styles from "./EditProfileModal.module.css";

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

export default function EditProfileModal({
                                             open,
                                             onClose,
                                             me,
                                             onSaveProfile, // async (patch) => updatedMe
                                             onChangePassword, // async ({old_password,new_password}) => void
                                             onSaveCard, // async ({pan,exp, cvc}) => updatedCard
                                         }) {
    const [tab, setTab] = useState("profile"); // profile | password | card
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        last_name: "",
        first_name: "",
        middle_name: "",
        birth_date: "",
        login: "",
    });

    const [pwd, setPwd] = useState({
        old_password: "",
        new_password: "",
    });

    const [card, setCard] = useState({
        pan: "",
        exp: "",
        cvc: "",
    });

    useEffect(() => {
        if (!open) return;

        setTab("profile");
        setError("");
        setSuccess("");
        setSubmitting(false);

        setForm({
            last_name: me?.last_name ?? "",
            first_name: me?.first_name ?? "",
            middle_name: me?.middle_name ?? "",
            birth_date: me?.birth_date ?? "",
            login: me?.login ?? "",
        });

        setPwd({ old_password: "", new_password: "" });

        setCard({
            pan: me?.card?.pan ?? "",
            exp: me?.card?.exp ?? "",
            cvc: me?.card?.cvc ?? "",
        });
    }, [open, me]);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e) {
            if (e.key === "Escape") onClose?.();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const canSaveProfile = useMemo(() => {
        return (
            form.last_name.trim() &&
            form.first_name.trim() &&
            form.login.trim() &&
            form.birth_date.trim() &&
            !submitting
        );
    }, [form, submitting]);

    const canChangePassword = useMemo(() => {
        return pwd.old_password && pwd.new_password && !submitting;
    }, [pwd, submitting]);

    const canSaveCard = useMemo(() => {
        return /^\d{12}$/.test(card.pan) && isValidExp(card.exp) && !submitting;
    }, [card, submitting]);

    async function handleSaveProfile() {
        setError("");
        setSuccess("");
        try {
            setSubmitting(true);

            const patch = {
                last_name: form.last_name.trim(),
                first_name: form.first_name.trim(),
                middle_name: form.middle_name.trim() || null,
                birth_date: form.birth_date.trim(), // YYYY-MM-DD
                login: form.login.trim(),
            };

            await onSaveProfile?.(patch);

            setSubmitting(false);
            setSuccess("Профиль обновлён");
        } catch (e) {
            setSubmitting(false);
            setError(e?.message || "Ошибка сохранения профиля");
        }
    }

    async function handleChangePassword() {
        setError("");
        setSuccess("");
        try {
            setSubmitting(true);
            await onChangePassword?.({
                old_password: pwd.old_password,
                new_password: pwd.new_password,
            });
            setSubmitting(false);
            setSuccess("Пароль изменён");
            setPwd({ old_password: "", new_password: "" });
        } catch (e) {
            setSubmitting(false);
            setError(e?.message || "Ошибка смены пароля");
        }
    }

    async function handleSaveCard() {
        setError("");
        setSuccess("");
        try {
            setSubmitting(true);
            const updatedCard = await onSaveCard?.({
                pan: card.pan,
                exp: card.exp,
                cvc: card.cvc,
            });
            setSubmitting(false);
            setSuccess("Данные карты сохранены");

            // если onSaveCard вернёт карту — обновим локально
            if (updatedCard?.pan) {
                setCard({ pan: updatedCard.pan, exp: updatedCard.exp, cvc: updatedCard.cvc });
            }
        } catch (e) {
            setSubmitting(false);
            setError(e?.message || "Ошибка сохранения карты");
        }
    }

    if (!open) return null;

    return (
        <div className={styles.backdrop} onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.title}>Редактирование профиля</div>
                    <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={tab === "profile" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                        onClick={() => {
                            setTab("profile");
                            setError("");
                            setSuccess("");
                        }}
                        disabled={submitting}
                    >
                        Данные
                    </button>
                    <button
                        type="button"
                        className={tab === "password" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                        onClick={() => {
                            setTab("password");
                            setError("");
                            setSuccess("");
                        }}
                        disabled={submitting}
                    >
                        Пароль
                    </button>
                    <button
                        type="button"
                        className={tab === "card" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                        onClick={() => {
                            setTab("card");
                            setError("");
                            setSuccess("");
                        }}
                        disabled={submitting}
                    >
                        Карта
                    </button>
                </div>

                {error && (
                    <div className={styles.alert}>
                        <div className={styles.alertTitle}>Ошибка</div>
                        <div className={styles.alertText}>{error}</div>
                    </div>
                )}

                {success && (
                    <div className={styles.success}>
                        <div className={styles.successTitle}>Готово</div>
                        <div className={styles.successText}>{success}</div>
                    </div>
                )}

                {tab === "profile" && (
                    <div className={styles.form}>
                        <label className={styles.field}>
                            <div className={styles.label}>Фамилия</div>
                            <input
                                className={styles.input}
                                value={form.last_name}
                                onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>Имя</div>
                            <input
                                className={styles.input}
                                value={form.first_name}
                                onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>Отчество (необязательно)</div>
                            <input
                                className={styles.input}
                                value={form.middle_name}
                                onChange={(e) => setForm((s) => ({ ...s, middle_name: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>Дата рождения</div>
                            <input
                                className={styles.input}
                                type="date"
                                value={form.birth_date}
                                onChange={(e) => setForm((s) => ({ ...s, birth_date: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>Почта (логин)</div>
                            <input
                                className={styles.input}
                                type="email"
                                value={form.login}
                                onChange={(e) => setForm((s) => ({ ...s, login: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <button
                            className={styles.submitBtn}
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={!canSaveProfile}
                        >
                            {submitting ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                )}

                {tab === "password" && (
                    <div className={styles.form}>
                        <label className={styles.field}>
                            <div className={styles.label}>Текущий пароль</div>
                            <input
                                className={styles.input}
                                type="password"
                                value={pwd.old_password}
                                onChange={(e) => setPwd((s) => ({ ...s, old_password: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>Новый пароль</div>
                            <input
                                className={styles.input}
                                type="password"
                                value={pwd.new_password}
                                onChange={(e) => setPwd((s) => ({ ...s, new_password: e.target.value }))}
                                disabled={submitting}
                            />
                        </label>

                        <button
                            className={styles.submitBtn}
                            type="button"
                            onClick={handleChangePassword}
                            disabled={!canChangePassword}
                        >
                            {submitting ? "Сохранение..." : "Изменить пароль"}
                        </button>
                    </div>
                )}

                {tab === "card" && (
                    <div className={styles.form}>
                        <div className={styles.cardHint}>
                            Здесь сохраняются данные карты в профиль пользователя (для автоподстановки при пополнении).
                        </div>

                        <label className={styles.field}>
                            <div className={styles.label}>PAN (12 цифр)</div>
                            <input
                                className={styles.input}
                                inputMode="numeric"
                                placeholder="000000000000"
                                value={card.pan}
                                onChange={(e) => setCard((s) => ({ ...s, pan: sanitizeDigits(e.target.value, 12) }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>Срок (MM/YY)</div>
                            <input
                                className={styles.input}
                                inputMode="numeric"
                                placeholder="MM/YY"
                                value={card.exp}
                                onChange={(e) => setCard((s) => ({ ...s, exp: sanitizeExp(e.target.value) }))}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <div className={styles.label}>CVC</div>
                            <input
                                className={styles.input}
                                inputMode="numeric"
                                placeholder="000"
                                value={card.cvc}
                                onChange={(e) => setCard((s) => ({ ...s, cvc: sanitizeDigits(e.target.value, 3) }))}
                                disabled={submitting}
                            />
                        </label>

                        <button
                            className={styles.submitBtn}
                            type="button"
                            onClick={handleSaveCard}
                            disabled={!canSaveCard}
                        >
                            {submitting ? "Сохранение..." : "Сохранить карту"}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}