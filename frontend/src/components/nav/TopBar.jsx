import { useNavigate } from "react-router-dom";
import styles from "./TopBar.module.css";

export default function TopBar({ onMenuClick }) {
    const navigate = useNavigate();

    return (
        <header className={styles.topbar}>
            <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open menu">
                <span />
                <span />
                <span />
            </button>

            <div className={styles.spacer} />

            <button
                className={styles.profileBtn}
                onClick={() => navigate("/profile")}
                aria-label="Profile"
                title="Профиль"
            >
                <div className={styles.avatar}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                            fill="currentColor"
                            d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12zm0 2c-4.2 0-7.6 2.1-7.6 4.7V21h15.2v-2.3c0-2.6-3.4-4.7-7.6-4.7z"
                        />
                    </svg>
                </div>
            </button>
        </header>
    );
}