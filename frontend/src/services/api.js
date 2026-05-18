import { request } from "./request.js";

export const api = {
    getCurrencies: async () => {
        const resp = await request("/currencies", { method: "GET" });
        const items = resp?.currencies ?? [];

        return items.map((c) => {
            const code = String(c?.name ?? "");
            return {
                id: c.id,
                code,
                symbol: code.slice(0, 1),
            };
        });
    },

    getExchangeRates: async () => {
        const resp = await request("/rates/ExchangeRates", { method: "GET" });
        const rates = resp?.rates ?? [];

        const items = rates.map((r) => ({
            id: r.id,
            sell_currency_id: r.sell_currency_id,
            buy_currency_id: r.buy_currency_id,
            rate: r.rate,
            is_active: r.is_active ?? true,
        }));

        return {
            items,
            lastUpdatedAt: new Date().toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    },

    getExchangeRatesAll: async () => {
        const resp = await request("/rates/ExchangeRates?include_inactive=true", { method: "GET" });
        const rates = resp?.rates ?? [];

        return rates.map((r) => ({
            id: r.id,
            sell_currency_id: r.sell_currency_id,
            buy_currency_id: r.buy_currency_id,
            rate: r.rate,
            is_active: r.is_active ?? true,
        }));
    },

    updateRate: async ({ id, rate }) => {
        return request(`/rates/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                rate: String(rate).replace(",", "."),
            }),
        });
    },

    deleteRateSoft: async (id) => {
        return request(`/rates/${id}`, { method: "DELETE" });
    },

    registerUser: (userData) =>
        request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        }),

    login: ({ login, password }) =>
        request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password }),
        }),

    getMe: () => request("/auth/me"),

    updateMe: async (patch) => {
        if (!patch?.last_name || !patch?.first_name) {
            throw new Error("Имя и фамилия обязательны");
        }
        if (!patch?.login || !String(patch.login).includes("@")) {
            throw new Error("Укажите корректную почту");
        }
        if (!patch?.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(patch.birth_date)) {
            throw new Error("Дата рождения должна быть в формате YYYY-MM-DD");
        }

        return request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify({
                firstName: patch.first_name,
                lastName: patch.last_name,
                middleName: patch.middle_name ?? null,
                birth_date: patch.birth_date,
                login: patch.login,
            }),
        });
    },

    changePassword: async ({ old_password, new_password }) => {
        if (!old_password || !new_password) throw new Error("Заполните оба поля пароля");
        if (String(new_password).length < 6) throw new Error("Новый пароль должен быть минимум 6 символов");

        return request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({ old_password, new_password }),
        });
    },

    updateMyCard: async ({ pan, exp, cvc }) => {
        if (!/^\d{12}$/.test(pan || "")) throw new Error("PAN должен быть из 12 цифр");
        if (!/^\d{2}\/\d{2}$/.test(exp || "")) throw new Error("Срок должен быть в формате MM/YY");
        if (!/^\d{3}$/.test(cvc || "")) throw new Error("CVC должен быть из 3 цифр");

        return request("/auth/me/card", {
            method: "PUT",
            body: JSON.stringify({ pan, exp, cvc }),
        });
    },

    getMyBalances: async () => {
        const resp = await request("/balances/my", { method: "GET" });
        const items = resp?.balances ?? [];

        return items.map((b) => ({
            currency_id: b.currency_id,
            amount: Number(b.amount ?? 0),
        }));
    },



    topUpBalance: async ({ currency_id, amount }) => {
        return request("/balances/top-up", {
            method: "POST",
            body: JSON.stringify({
                currency_id,
                amount: String(amount).replace(",", "."),
            }),
        });
    },

    getOperations: async () => {
        const resp = await request("/operations", { method: "GET" });
        return resp?.items ?? [];
    },

    confirmExchange: async ({ rate, amountSell }) => {
        if (!rate?.id) throw new Error("Не выбран курс (rate.id отсутствует)");

        const resp = await request("/exchange/confirm", {
            method: "POST",
            body: JSON.stringify({
                rate_id: rate.id,
                amount_sell: String(amountSell).replace(",", "."),
            }),
        });

        return {
            balances: resp?.balances ?? [],
            credited: resp?.credited ?? 0,
            operation_id: resp?.operation_id,
        };
    },

    createRate: async ({ sell_currency_id, buy_currency_id, rate }) => {
        return request("/rates", {
            method: "POST",
            body: JSON.stringify({
                sell_currency_id,
                buy_currency_id,
                rate: Number(String(rate).replace(",", ".")),
            }),
        });
    },

    getMyCard: async () => {
        return request("/auth/me/card", { method: "GET" });
    },
};