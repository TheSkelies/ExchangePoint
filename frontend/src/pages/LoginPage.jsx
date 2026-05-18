import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import { api } from "../services/api.js";

export default function LoginPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        login: "",
        password: "",
    });

    const [state, setState] = useState({
        submitting: false,
        error: "",
    });

    const canSubmit = useMemo(() => {
        return (
            form.login.trim().includes("@") &&
            form.password.length > 0 &&
            !state.submitting
        );
    }, [form, state.submitting]);

    async function onSubmit(e) {
        e.preventDefault();
        setState({ submitting: true, error: "" });

        try {
            const resp = await api.login({
                login: form.login.trim(),
                password: form.password,
            });

            localStorage.setItem("access_token", resp.token);

            const me = await api.getMe();
            localStorage.setItem("role", me.role);
            window.dispatchEvent(new Event("auth:changed"));

            navigate("/profile");
        } catch (err) {
            setState({
                submitting: false,
                error: err?.message || "Ошибка входа",
            });
        }
    }

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Вход</h1>
                <div className={styles.subtitle}>Войдите в аккаунт</div>
            </div>

            {state.error && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>Ошибка</div>
                    <div className={styles.alertText}>{state.error}</div>
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
                        onChange={(e) => setForm((s) => ({ ...s, login: e.target.value }))}
                        disabled={state.submitting}
                        autoComplete="email"
                    />
                </label>

                <label className={styles.field}>
                    <div className={styles.label}>Пароль</div>
                    <input
                        className={styles.input}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                        disabled={state.submitting}
                        autoComplete="current-password"
                    />
                </label>

                <button className={styles.primaryBtn} type="submit" disabled={!canSubmit}>
                    {state.submitting ? "Вход..." : "Войти"}
                </button>

                <Link className={styles.secondaryBtn} to="/register">
                    Нет аккаунта? Зарегистрироваться
                </Link>
            </form>
        </div>
    );
}