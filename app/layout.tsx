import "./styles/globals.less";
import styles from "./layout.module.less";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "TaskTracker",
    description: "Трекер задач",
};

// Применяем сохранённую тему до гидратации — иначе тёмная тема мигнёт светлой
const themeInitScript = `try{var t=localStorage.getItem("theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

                <header className={styles.header}>
                    <span className={styles.logo}>TaskTracker</span>
                    <ThemeToggle />
                </header>

                {children}
            </body>
        </html>
    );
}
