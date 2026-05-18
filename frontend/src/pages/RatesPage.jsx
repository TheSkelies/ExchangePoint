import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./RatesPage.module.css";
import { api } from "../services/api.js";
import { formatRatePair } from "../utils/format.js";
import RateCard from "../components/rates/RateCard.jsx";
import RateCardSkeleton from "../components/rates/RateCardSkeleton.jsx";

export default function RatesPage() {
    const navigate = useNavigate();

    const [state, setState] = useState({
        loading: true,
        error: "",
        currencies: [],
        rates: [],
        lastUpdatedAt: null,
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setState((s) => ({ ...s, loading: true, error: "" }));
            try {
                const [currencies, ratesResp] = await Promise.all([
                    api.getCurrencies(),
                    api.getExchangeRates(),
                ]);

                if (cancelled) return;

                setState({
                    loading: false,
                    error: "",
                    currencies,
                    rates: ratesResp.items,
                    lastUpdatedAt: ratesResp.lastUpdatedAt,
                });
            } catch (e) {
                if (cancelled) return;
                setState((s) => ({
                    ...s,
                    loading: false,
                    error: e?.message || "Ошибка загрузки",
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

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Курсы обмена</h1>
                    <div className={styles.subtitle}>Актуальные курсы валют</div>
                </div>

                <div className={styles.infoBox}>
                    <div className={styles.infoIcon}>i</div>
                    <div className={styles.infoText}>
                        <div className={styles.infoTitle}>Курсы обновляются автоматически</div>
                        <div className={styles.infoMeta}>
                            Последнее обновление:{" "}
                            {state.loading ? "—" : state.lastUpdatedAt ? state.lastUpdatedAt : "—"}
                        </div>
                    </div>
                </div>
            </div>

            {state.error && (
                <div className={styles.alert}>
                    <div className={styles.alertTitle}>Не удалось загрузить данные</div>
                    <div className={styles.alertText}>{state.error}</div>
                </div>
            )}

            <div className={styles.grid}>
                {state.loading
                    ? Array.from({ length: 3 }).map((_, idx) => <RateCardSkeleton key={idx} />)
                    : state.rates.map((r) => {
                        const sell = currencyById.get(r.sell_currency_id);
                        const buy = currencyById.get(r.buy_currency_id);

                        const fromCode = sell?.code ?? `#${r.sell_currency_id}`;
                        const toCode = buy?.code ?? `#${r.buy_currency_id}`;
                        const subtitle = `${sell?.code ?? fromCode} → ${buy?.code ?? toCode}`;

                        return (
                            <div
                                key={r.id}
                                className={styles.clickWrap}
                                role="button"
                                tabIndex={0}
                                onClick={() => navigate(`/exchange/${r.id}`)}
                                onKeyDown={(e) => e.key === "Enter" && navigate(`/exchange/${r.id}`)}
                            >
                                <RateCard
                                    from={fromCode}
                                    to={toCode}
                                    subtitle={subtitle}
                                    rateText={formatRatePair(r.rate)}
                                    accent={r.id % 2 === 0 ? "pink" : "blue"}
                                />
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}