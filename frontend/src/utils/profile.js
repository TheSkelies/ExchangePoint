export function buildFullName({ last_name, first_name, middle_name }) {
    return [last_name, first_name, middle_name].filter(Boolean).join(" ");
}

export function calcAge(birthDateStr) {
    if (!birthDateStr) return null;
    const d = new Date(birthDateStr);
    if (Number.isNaN(d.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();

    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;

    return age;
}

export function pluralRuYears(n) {
    // 1 год, 2-4 года, 5-0 лет
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return "лет";
    if (mod10 === 1) return "год";
    if (mod10 >= 2 && mod10 <= 4) return "года";
    return "лет";
}