import { useEffect, useMemo, useState } from "react";
import styles from "./ProfilePage.module.css";
import { api } from "../services/api.js";
import { buildFullName, calcAge, pluralRuYears } from "../utils/profile.js";

import TopUpModal from "../components/modals/TopUpModal.jsx";
import EditProfileModal from "../components/modals/EditProfileModal.jsx";

function CardSkeleton({ height = 74 }) {
    return <div className={styles.skeleton} style={{ height }} aria-busy="true" />;
}

export default function ProfilePage() {
    const [topUpOpen, setTopUpOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [state, setState] = useState({
        loading: true,
        error: "",
        me: null,
        balances: [],
        currencies: [],
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setState((s) => ({ ...s, loading: true, error: "" }));
            try {
                const [me, balancesResp, currencies] = await Promise.all([
                    api.getMe(),
                    api.getMyBalances(),
                    api.getCurrencies(),
                ]);

                if (cancelled) return;

                setState({
                    loading: false,
                    error: "",
                    me,
                    balances: balancesResp,
                    currencies,
                });
            } catch (e) {
                if (cancelled) return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: e?.message || "Ошибка загрузки профиля",
                }));
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

    const fullName = state.me ? buildFullName(state.me) : "";
    const age = state.me ? calcAge(state.me.birth_date) : null;

    const balanceCards = useMemo(() => {
        const items = state.balances
            .map((b) => {
                const cur = currencyById.get(b.currency_id);
                return {
                    currency_id: b.currency_id,
                    code: cur?.code ?? `#${b.currency_id}`,
                    symbol: cur?.symbol ?? "",
                    balance: b.amount, // <-- здесь
                };
            })
            .sort((a, b) => String(a.code).localeCompare(String(b.code), "ru"));

        return items;
    }, [state.balances, currencyById]);

    function onEditProfile() {
        setEditOpen(true);
    }

    function onTopUp() {
        setTopUpOpen(true);
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Профиль</h1>
            </div>

            {state.error && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>Ошибка</div>
                    <div className={styles.alertText}>{state.error}</div>
                </div>
            )}

            <section className={styles.userCard}>
                {state.loading ? (
                    <div className={styles.userSkeletonWrap}>
                        <div className={styles.userSkeletonLine} />
                        <div className={styles.userSkeletonLineSmall} />
                    </div>
                ) : (
                    <>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{fullName}</div>
                            <div className={styles.userMeta}>
                                {age != null ? `${age} ${pluralRuYears(age)}` : "—"} • {state.me?.login ?? "—"}
                            </div>
                        </div>

                        <button className={styles.editBtn} type="button" onClick={onEditProfile}>
                            Редактировать профиль
                        </button>
                    </>
                )}
            </section>

            <div className={styles.balances}>
                {state.loading ? (
                    <>
                        <CardSkeleton height={74} />
                        <CardSkeleton height={74} />
                    </>
                ) : (
                    balanceCards.map((b) => (
                        <section key={b.currency_id} className={styles.balanceCard}>
                            <div className={styles.balanceBadge} aria-hidden="true">
                                {b.symbol || b.code}
                            </div>

                            <div className={styles.balanceMid}>
                                <div className={styles.balanceLabel}>
                                    Ваш баланс в <span className={styles.balanceAccent}>{b.code}</span>
                                </div>
                            </div>

                            <div className={styles.balanceRight}>
                                <div className={styles.balanceValue}>
                                    {Number(String(b.balance).replace(",", ".")).toLocaleString("ru-RU", {
                                        maximumFractionDigits: 8,
                                    })}
                                </div>
                                <div className={styles.balanceCode}>{b.code}</div>
                            </div>
                        </section>
                    ))
                )}
            </div>

                <button className={styles.topUpBtn} type="button" onClick={onTopUp} disabled={state.loading}>
                <span className={styles.plus}>＋</span>
                Пополнить баланс
            </button>

            <section className={styles.infoBox}>
                <div className={styles.infoIcon}>i</div>
                <div>
                    <div className={styles.infoTitle}>Информация</div>
                    <div className={styles.infoMeta}>
                        Вы можете пополнить баланс в любой из доступных валют.
                    </div>
                </div>
            </section>

            <TopUpModal
                open={topUpOpen}
                onClose={() => setTopUpOpen(false)}
                savedCard={state.me?.card ?? null}
                currencies={state.currencies.map((c) => ({ id: c.id, name: c.code ?? c.name }))}
                onSubmit={async ({ amount, currency_id, card }) => {
                    await api.topUpBalance({ currency_id, amount, card });

                    const balancesResp = await api.getMyBalances();
                    setState((s) => ({ ...s, balances: balancesResp }));
                }}
            />

            <EditProfileModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                me={state.me}
                onSaveProfile={async (patch) => {
                    const updated = await api.updateMe(patch);
                    setState((s) => ({ ...s, me: { ...s.me, ...updated } }));
                    return updated;
                }}
                onChangePassword={async ({ old_password, new_password }) => {
                    await api.changePassword({ old_password, new_password });
                }}
                onSaveCard={async ({ pan, exp, cvc }) => {
                    const updatedCard = await api.updateMyCard({ pan, exp, cvc });
                    setState((s) => ({
                        ...s,
                        me: { ...s.me, card: updatedCard },
                    }));
                    return updatedCard;
                }}
            />

        </div>
    );
}