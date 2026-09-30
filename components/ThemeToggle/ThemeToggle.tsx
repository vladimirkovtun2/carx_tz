'use client';

import { useCallback, useEffect, useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.less";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

// Подписка на изменения темы (в т.ч. из других вкладок)
function subscribe(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
}

// Чтение текущей темы из localStorage (клиент)
function getSnapshot(): Theme {
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

// Серверный снапшот — всегда светлая (первый рендер идентичен на сервере и клиенте)
function getServerSnapshot(): Theme {
    return "light";
}

export default function ThemeToggle() {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    // Применяем тему к <html> при изменении (в т.ч. при гидратации)
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const next: Theme = theme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        window.localStorage.setItem(STORAGE_KEY, next);
        // Событие "storage" в том же окне не возникает само — диспатчим вручную,
        // чтобы useSyncExternalStore перечитал снапшот
        window.dispatchEvent(new Event("storage"));
    }, [theme]);

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            aria-label="Переключить тему"
        >
            {theme === "light" ? "🌙 Темная" : "☀️ Светлая"}
        </button>
    );
}