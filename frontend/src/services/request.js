const API_URL = "http://localhost:8000/api";

function getToken() {
    return localStorage.getItem("access_token");
}

export async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getToken();

    if (token) headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
        const msg =
            data && typeof data === "object" && data.detail
                ? data.detail
                : `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return data;
}