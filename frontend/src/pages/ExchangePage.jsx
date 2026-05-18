import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./ExchangePage.module.css";
import { api } from "../services/api.js";
import { formatRatePair } from "../utils/format.js";
import RateCardSkeleton from "../components/rates/RateCardSkeleton.jsx";
import { sanitizeAmountInput, toNumberFromInput } from "../utils/moneyInput.js";

export default function ExchangePage() {
    const { rateId } = useParams();

    const [state, setState] = useState({
        loading: true,
        submitting: false,
        error: "",
        success: "",
        currencies: [],
        rate: null,
        lastUpdatedAt: null,
        balances: [],
        amountSellInput: "",
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setState((s) => ({
                ...s,
                loading: true,
                error: "",
                success: "",
            }));

            try {
                const [currencies, ratesResp, balances] = await Promise.all([
                    api.getCurrencies(),
                    api.getExchangeRates(),
                    api.getMyBalances(),
                ]);

                const rate = ratesResp.items.find((x) => String(x.id) === String(rateId));
                if (!rate) throw new Error("Курс не найден");

                if (cancelled) return;

                setState((s) => ({
                    ...s,
                    loading: false,
                    currencies,
                    rate,
                    balances,
                    lastUpdatedAt: ratesResp.lastUpdatedAt,
                }));
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
    }, [rateId]);

    const currencyById = useMemo(() => {
        const map = new Map();
        for (const c of state.currencies) map.set(c.id, c);
        return map;
    }, [state.currencies]);

    const balanceByCurrencyId = useMemo(() => {
        const map = new Map();
        for (const b of state.balances) map.set(b.currency_id, b);
        return map;
    }, [state.balances]);

    const sell = state.rate ? currencyById.get(state.rate.sell_currency_id) : null;
    const buy = state.rate ? currencyById.get(state.rate.buy_currency_id) : null;

    const fromCode = sell?.code ?? "";
    const toCode = buy?.code ?? "";
    const subtitle = sell && buy ? `${sell.name} → ${buy.name}` : "";

    const amountSell = toNumberFromInput(state.amountSellInput);
    const amountBuy =
        state.rate && Number.isFinite(amountSell) ? amountSell * Number(state.rate.rate) : NaN;

    const sellBalance = state.rate
        ? balanceByCurrencyId.get(state.rate.sell_currency_id)?.amount ?? 0
        : 0;

    async function onConfirm() {
        if (!state.rate) return;

        setState((s) => ({ ...s, submitting: true, error: "", success: "" }));
        try {
            const resp = await api.confirmExchange({
                rate: state.rate,
                amountSell: amountSell,
            });

            setState((s) => ({
                ...s,
                submitting: false,
                balances: resp.balances,
                amountSellInput: "",
                success: `Готово. Зачислено: ${resp.credited.toLocaleString("ru-RU", {
                    maximumFractionDigits: 8,
                })} ${toCode}`,
            }));
        } catch (e) {
            setState((s) => ({
                ...s,
                submitting: false,
                error: e?.message || "Ошибка подтверждения",
            }));
        }
    }

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Обмен валют</h1>
                <div className={styles.subtitle}>Укажите направление и получите средства</div>
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

            <section className={styles.sectionCard}>
                <div className={styles.sectionLabel}>Направление обмена</div>

                {state.loading || !state.rate ? (
                    <RateCardSkeleton />
                ) : (
                    <div className={styles.rateWrap}>
                        <div className={styles.rateInner}>
                            <div className={styles.pairCodes}>
                                <span className={styles.code}>{fromCode}</span>
                                <span className={styles.arrow}>→</span>
                                <span className={styles.code}>{toCode}</span>
                            </div>
                            <div className={styles.ratePill}>{formatRatePair(state.rate.rate)}</div>
                        </div>

                        <div className={styles.pairSubtitle}>{subtitle}</div>
                    </div>
                )}
            </section>

            <section className={styles.balanceCard}>
                {state.loading ? (
                    <div className={styles.balanceSkeleton} />
                ) : (
                    <>
                        <div className={styles.balanceBadge} aria-hidden="true">
                            {sell?.symbol ?? "$"}
                        </div>

                        <div className={styles.balanceMid}>
                            <div className={styles.balanceLabel}>
                                Ваш баланс в <span className={styles.balanceAccent}>{fromCode}</span>
                            </div>
                        </div>

                        <div className={styles.balanceRight}>
                            <div className={styles.balanceValue}>
                                {Number(sellBalance).toLocaleString("ru-RU", { maximumFractionDigits: 8 })}
                            </div>
                            <div className={styles.balanceCode}>{fromCode}</div>
                        </div>
                    </>
                )}
            </section>

            <section className={styles.formCard}>
                <div className={styles.field}>
                    <div className={styles.fieldLabel}>Отдаёте</div>
                    <div className={styles.inputRow}>
                        <input
                            className={styles.input}
                            inputMode="decimal"
                            placeholder="0"
                            value={state.amountSellInput}
                            onChange={(e) =>
                                setState((s) => ({ ...s, amountSellInput: sanitizeAmountInput(e.target.value) }))
                            }
                            disabled={state.loading || state.submitting}
                        />
                        <div className={styles.currencyTag}>{fromCode}</div>
                    </div>
                    <div className={styles.hint}>
                        Доступно:{" "}
                        <b>
                            {Number(sellBalance).toLocaleString("ru-RU", { maximumFractionDigits: 8 })} {fromCode}
                        </b>
                    </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                    <div className={styles.fieldLabel}>Получите</div>
                    <div className={styles.inputRow}>
                        <div className={styles.readonly}>
                            {Number.isFinite(amountBuy)
                                ? amountBuy.toLocaleString("ru-RU", { maximumFractionDigits: 8 })
                                : "—"}
                        </div>
                        <div className={styles.currencyTag}>{toCode}</div>
                    </div>
                    <div className={styles.hint}>Сумма рассчитывается по текущему курсу</div>
                </div>
            </section>

            <section className={styles.actions}>
                <button
                    className={styles.confirmBtn}
                    type="button"
                    onClick={onConfirm}
                    disabled={
                        state.loading ||
                        state.submitting ||
                        !Number.isFinite(amountSell) ||
                        amountSell <= 0 ||
                        amountSell > sellBalance
                    }
                >
                    {state.submitting ? "Подтверждение..." : "Подтвердить"}
                </button>
            </section>

            <section className={styles.infoBox}>
                <div className={styles.infoIcon}>i</div>
                <div>
                    <div className={styles.infoTitle}>Курс обновляется автоматически</div>
                    <div className={styles.infoMeta}>
                        Последнее обновление: {state.loading ? "—" : state.lastUpdatedAt || "—"}
                    </div>
                </div>
            </section>
        </div>
    );
}