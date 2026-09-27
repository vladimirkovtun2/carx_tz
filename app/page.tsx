'use client';

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import FilterPanel from "@/components/FilterPanel/FilterPanel";
import TaskCard from "@/components/TaskCard/TaskCard";
import CreateTaskModal, { NewTaskPayload } from "@/components/CreateTaskModal/CreateTaskModal";
import styles from "./page.module.less";

export interface Task {
    id: string;
    title: string;
    description: string;
    assignee: string;
    status: "Новая" | "В работе" | "Выполнена";
    result: string;
    priority: "Низкий" | "Средний" | "Высокий";
    createdAt: string;
    comments: string[];
}

function TasksContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Фильтры
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "Все");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(
        (searchParams.get("sort") as "newest" | "oldest") || "newest"
    );

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Синхронизация фильтров с URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (statusFilter !== "Все") params.set("status", statusFilter);
        if (sortOrder !== "newest") params.set("sort", sortOrder);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [searchQuery, statusFilter, sortOrder, pathname, router]);

    useEffect(() => {
        const loadScheduleData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch('/api/tasks');
                if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

                const data = await response.json();
                setTasks(data);
            } catch (err) {
                setError('Не удалось загрузить список задач.');
            } finally {
                setIsLoading(false);
            }
        };

        loadScheduleData();
    }, []);

    const handleCreateTask = async (payload: NewTaskPayload) => {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Не удалось создать задачу");

        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
    };

    const filteredAndSortedTasks = useMemo(() => {
        return tasks
            .filter((task) =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .filter((task) => {
                if (statusFilter === "Все") return true;
                return task.status === statusFilter;
            })
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
            });
    }, [tasks, searchQuery, statusFilter, sortOrder]);

    return (
        <main className={styles.container}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Список задач</h1>
                <button
                    className={styles.createBtn}
                    onClick={() => setIsModalOpen(true)}
                >
                    + Добавить задачу
                </button>
            </div>

            <FilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                disabled={isLoading || !!error}
            />

            <section aria-label="Список задач">
                {isLoading ? (
                    <p className={styles.loadingMessage}>Загрузка задач...</p>
                ) : error ? (
                    <p className={styles.errorMessage}>{error}</p>
                ) : filteredAndSortedTasks.length === 0 ? (
                    <p>Задачи не найдены.</p>
                ) : (
                    <ul className={styles.taskList}>
                        {filteredAndSortedTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </ul>
                )}
            </section>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateTask}
            />
        </main>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка интерфейса...</div>}>
            <TasksContent />
        </Suspense>
    );
}