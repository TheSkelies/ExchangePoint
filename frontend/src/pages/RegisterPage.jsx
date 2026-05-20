import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./RegisterPage.module.css";
import { api } from "../services/api.js";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        login: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        birth_date: "",
        password: "",
        password2: "",
    });

    const [state, setState] = useState({
        submitting: false,
        error: "",
        success: "",
    });

    const canSubmit = useMemo(() => {
        const emailOk = form.login.trim().includes("@");
        const pwdOk = form.password.length >= 6 && form.password === form.password2;
        const reqOk =
            form.first_name.trim() &&
            form.last_name.trim() &&
            form.birth_date.trim() &&
            emailOk &&
            pwdOk;
        return Boolean(reqOk) && !state.submitting;
    }, [form, state.submitting]);

    function setField(name, value) {
        setForm((s) => ({ ...s, [name]: value }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setState({ submitting: true, error: "", success: "" });

        try {
            if (form.password !== form.password2) {
                throw new Error("Пароли не совпадают");
            }

            await api.registerUser({
                login: form.login.trim(),
                firstName: form.first_name.trim(),
                lastName: form.last_name.trim(),
                middleName: form.middle_name.trim() || null,
                birth_date: form.birth_date.trim(),
                password: form.password,
            });

            setState({ submitting: false, error: "", success: "Аккаунт создан. Теперь можно войти." });

            setTimeout(() => navigate("/login"), 600);
        } catch (err) {
            setState({
                submitting: false,
                error: err?.message || "Ошибка регистрации",
                success: "",
            });
        }
    }

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Регистрация</h1>
                <div className={styles.subtitle}>Создайте новый аккаунт</div>
            </div>

            {state.error && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>Ошибка</div>
                    <div className={styles.alertText}>{state.error}</div>
                </div>
            )}

            {state.success && (
                <div className={styles.success}>
                    <div className={styles.successTitle}>Успешно</div>
                    <div className={styles.successText}>{state.success}</div>
                </div>
            )}

            <form className={styles.card} onSubmit={onSubmit}>
                <label className={styles.field}>
                    <div className={styles.label}>Почта (логин)</div>
                    <input
                        className={styles.input}
                        type="email"
                        placeholder="user@mail.com"
                        value={form.login}
                        onChange={(e) => setField("login", e.target.value)}
                        disabled={state.submitting}
                        autoComplete="email"
                    />
                </label>

                <div className={styles.row}>
                    <label className={styles.field}>
                        <div className={styles.label}>Имя</div>
                        <input
                            className={styles.input}
                            value={form.first_name}
                            onChange={(e) => setField("first_name", e.target.value)}
                            disabled={state.submitting}
                            autoComplete="given-name"
                        />
                    </label>

                    <label className={styles.field}>
                        <div className={styles.label}>Фамилия</div>
                        <input
                            className={styles.input}
                            value={form.last_name}
                            onChange={(e) => setField("last_name", e.target.value)}
                            disabled={state.submitting}
                            autoComplete="family-name"
                        />
                    </label>
                </div>

                <label className={styles.field}>
                    <div className={styles.label}>Отчество (опционально)</div>
                    <input
                        className={styles.input}
                        value={form.middle_name}
                        onChange={(e) => setField("middle_name", e.target.value)}
                        disabled={state.submitting}
                    />
                </label>

                <label className={styles.field}>
                    <div className={styles.label}>Дата рождения</div>
                    <input
                        className={styles.input}
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setField("birth_date", e.target.value)}
                        disabled={state.submitting}
                    />
                </label>

                <div className={styles.row}>
                    <label className={styles.field}>
                        <div className={styles.label}>Пароль</div>
                        <input
                            className={styles.input}
                            type="password"
                            value={form.password}
                            onChange={(e) => setField("password", e.target.value)}
                            disabled={state.submitting}
                            autoComplete="new-password"
                        />
                    </label>

                    <label className={styles.field}>
                        <div className={styles.label}>Подтверждение пароля</div>
                        <input
                            className={styles.input}
                            type="password"
                            value={form.password2}
                            onChange={(e) => setField("password2", e.target.value)}
                            disabled={state.submitting}
                            autoComplete="new-password"
                        />
                    </label>
                </div>

                <button className={styles.primaryBtn} type="submit" disabled={!canSubmit}>
                    {state.submitting ? "Регистрация..." : "Зарегистрироваться"}
                </button>

                <Link className={styles.secondaryBtn} to="/login">
                    Уже есть аккаунт? Войти
                </Link>

                <div className={styles.hint}>
                    Пароль должен быть минимум 6 символов. Поле “Отчество” можно не заполнять.
                </div>
            </form>
        </div>
    );
}