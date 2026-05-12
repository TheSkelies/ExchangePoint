import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

function MenuItem({ to, icon, children, onNavigate }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
            onClick={onNavigate}
        >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{children}</span>
        </NavLink>
    );
}

export default function Sidebar({ sidebarState }) {
    const { open, close } = sidebarState;

    return (
        <aside className={open ? `${styles.sidebar} ${styles.open}` : styles.sidebar}>
            <div className={styles.brand}>
                <div className={styles.logoMark} />
                <div className={styles.brandText}>
                    <div className={styles.brandName}>ExchangePoint</div>
                </div>

                <button className={styles.closeBtn} onClick={close} aria-label="Close menu">
                    ✕
                </button>
            </div>

            <nav className={styles.nav}>
                <div className={styles.sectionTitle}>Меню</div>
                <MenuItem
                    to="/rates"
                    icon={
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                                fill="currentColor"
                                d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 2h5v2H8V9zm0 4h8v2H8v-2z"
                            />
                        </svg>
                    }
                    onNavigate={close}
                >
                    Курсы обмена
                </MenuItem>

                <MenuItem
                    to="/history"
                    icon={
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                                fill="currentColor"
                                d="M12 8v5l4 2-.8 1.8L10 14V8h2zM12 2a10 10 0 1010 10h-2a8 8 0 11-2.3-5.7L15 9h7V2l-2.7 2.7A9.96 9.96 0 0012 2z"
                            />
                        </svg>
                    }
                    onNavigate={close}
                >
                    История операций
                </MenuItem>
            </nav>

            <div className={styles.footerHint}>
                <div className={styles.footerCard}>
                    <div className={styles.footerTitle}>Курсы обновляются автоматически</div>
                    <div className={styles.footerText}>Последнее обновление будет из API</div>
                </div>
            </div>
        </aside>
    );
}