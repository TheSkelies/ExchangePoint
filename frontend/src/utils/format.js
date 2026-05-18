export function formatRatePair(rate) {
    const num = Number(rate);

    if (!Number.isFinite(num)) return "1 : —";

    // Для "читаемости": если >= 10, показываем 2 знака после запятой, иначе до 4
    const formatted =
        num >= 10
            ? num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : num.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

    return `1 : ${formatted}`;
}

export function formatDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}