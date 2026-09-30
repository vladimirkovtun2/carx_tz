import "./styles/globals.less";
import styles from "./layout.module.less";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <body>
                <header className={styles.header}>
                    <span className={styles.logo}>TaskTracker</span>
                    <ThemeToggle />
                </header>

                {children}
            </body>
        </html>
    );
}