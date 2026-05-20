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
                    to="/my_history"
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
                    Твоя история операций
                </MenuItem>

                <MenuItem
                    to="/rates/edit"
                    icon={
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                                fill="currentColor"
                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                            />
                        </svg>
                    }
                    onNavigate={close}
                >
                    Редактировать курсы
                </MenuItem>


                <MenuItem
                    to="/all_history"
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
                    Вся история операций
                </MenuItem>

                <MenuItem
                    to="/currencies"
                    icon={
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                                fill="currentColor"
                                d="M12 1a11 11 0 1011 11A11 11 0 0012 1zm1 17.93V20h-2v-1.07a8.95 8.95 0 01-3.6-1.4l1-1.73A7.1 7.1 0 0011 16.9V13H9a3 3 0 010-6h2V4h2v3h2.2a6.5 6.5 0 012.5.6l-.8 1.8A5.3 5.3 0 0015.2 9H13v4h2a3 3 0 010 6h-2z"
                            />
                        </svg>
                    }
                    onNavigate={close}
                >
                    Валюты
                </MenuItem>
            </nav>


        </aside>
    );
}