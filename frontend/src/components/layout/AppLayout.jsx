import { Outlet } from "react-router-dom";
import Sidebar from "../nav/Sidebar.jsx";
import TopBar from "../nav/TopBar.jsx";
import styles from "./AppLayout.module.css";
import { useMemo, useState } from "react";

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    return (
        <div className={styles.shell}>
            <Sidebar sidebarState={sidebarState} />

            {sidebarOpen && <div className={styles.overlay} onClick={onCloseSidebar} />}

            <div className={styles.main}>
                <TopBar onMenuClick={onToggleSidebar} />
                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}