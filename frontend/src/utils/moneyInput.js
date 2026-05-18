/**
 * Разрешаем ввод: цифры и один разделитель (точка или запятая).
 * Возвращаем строку, пригодную для отображения в input.
 */
export function sanitizeAmountInput(raw) {
    const s = String(raw ?? "");

    // оставляем только цифры, точку и запятую
    let filtered = s.replace(/[^\d.,]/g, "");

    // если есть и ',' и '.', оставим только первый встретившийся как разделитель
    const firstComma = filtered.indexOf(",");
    const firstDot = filtered.indexOf(".");

    let sepIndex = -1;
    let sepChar = "";

    if (firstComma !== -1 && firstDot !== -1) {
        sepIndex = Math.min(firstComma, firstDot);
        sepChar = filtered[sepIndex];
    } else if (firstComma !== -1) {
        sepIndex = firstComma;
        sepChar = ",";
    } else if (firstDot !== -1) {
        sepIndex = firstDot;
        sepChar = ".";
    }

    if (sepIndex !== -1) {
        const before = filtered.slice(0, sepIndex).replace(/[.,]/g, "");
        const after = filtered.slice(sepIndex + 1).replace(/[.,]/g, "");
        filtered = `${before}${sepChar}${after}`;
    } else {
        filtered = filtered.replace(/[.,]/g, "");
    }

    // убираем ведущие нули типа 00012 -> 12 (но оставляем "0" и "0.xx")
    if (/^0\d+/.test(filtered)) {
        filtered = filtered.replace(/^0+/, "");
        if (filtered === "") filtered = "0";
    }

    return filtered;
}

export function toNumberFromInput(value) {
    if (value == null || value === "") return NaN;
    const s = String(value).replace(",", ".");
    return Number(s);
}