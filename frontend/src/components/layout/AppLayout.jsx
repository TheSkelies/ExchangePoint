import { Outlet } from "react-router-dom";
import Sidebar from "../nav/Sidebar.jsx";
import TopBar from "../nav/TopBar.jsx";
import styles from "./AppLayout.module.css";
import { useEffect, useMemo, useState } from "react";

function hasToken() {
    return Boolean(localStorage.getItem("access_token"));
}

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAuthed, setIsAuthed] = useState(hasToken()); // <-- важно

    const onToggleSidebar = () => setSidebarOpen((v) => !v);
    const onCloseSidebar = () => setSidebarOpen(false);

    const sidebarState = useMemo(
        () => ({
            open: sidebarOpen,
            toggle: onToggleSidebar,
            close: onCloseSidebar,
        }),
        [sidebarOpen]
    );

    useEffect(() => {
        const onAuthChanged = () => setIsAuthed(hasToken());
        window.addEventListener("auth:changed", onAuthChanged);

        onAuthChanged();

        return () => window.removeEventListener("auth:changed", onAuthChanged);
    }, []);

    const onLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth:changed"));
    };

    return (
        <div className={styles.shell}>
            <Sidebar sidebarState={sidebarState} />

            {sidebarOpen && <div className={styles.overlay} onClick={onCloseSidebar} />}

            <div className={styles.main}>
                <TopBar onMenuClick={onToggleSidebar} isAuthed={isAuthed} onLogout={onLogout} />
                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}