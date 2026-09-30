'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import FilterPanel from "@/components/FilterPanel/FilterPanel";
import TaskCard from "@/components/TaskCard/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal/CreateTaskModal";
import { filterAndSortTasks } from "@/lib/filterTasks";
import { Task, TaskStatus, NewTaskPayload, TASK_STATUSES } from "@/types/task";
import styles from "./page.module.less";

const URL_SYNC_DELAY = 400;

// Значение из URL может быть любой строкой — оставляем только валидные статусы
function parseStatus(value: string | null): TaskStatus | "Все" {
    return value !== null && TASK_STATUSES.includes(value as TaskStatus)
        ? (value as TaskStatus)
        : "Все";
}

function TasksContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Начальное состояние контролов — из URL
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
    const [assigneeQuery, setAssigneeQuery] = useState(() => searchParams.get("assignee") ?? "");
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "Все">(() => parseStatus(searchParams.get("status")));
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">(() =>
        searchParams.get("sort") === "oldest" ? "oldest" : "newest"
    );

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Стабильные колбэки для модалки (чтобы эффект фокуса не перезапускался)
    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    // Загрузка вынесена в useCallback — доступна и эффекту, и кнопке «Повторить»
    const loadTasks = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
            const data: Task[] = await response.json();
            setTasks(data);
        } catch {
            setError('Не удалось загрузить список задач.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Back/Forward: перечитываем контролы из URL при навигации по истории
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            setSearchQuery(params.get("q") ?? "");
            setAssigneeQuery(params.get("assignee") ?? "");
            setStatusFilter(parseStatus(params.get("status")));
            setSortOrder(params.get("sort") === "oldest" ? "oldest" : "newest");
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Отложенная синхронизация фильтров с URL (debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchQuery) params.set("q", searchQuery);
            if (assigneeQuery) params.set("assignee", assigneeQuery);
            if (statusFilter !== "Все") params.set("status", statusFilter);
            if (sortOrder !== "newest") params.set("sort", sortOrder);

            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        }, URL_SYNC_DELAY);

        return () => clearTimeout(timer);
    }, [searchQuery, assigneeQuery, statusFilter, sortOrder, pathname, router]);

    const handleCreateTask = async (payload: NewTaskPayload) => {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error ?? "Не удалось создать задачу");
        }

        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
    };

    // Фильтрация — чистая функция из lib (покрыта тестами)
    const filteredAndSortedTasks = useMemo(
        () => filterAndSortTasks(tasks, { searchQuery, assigneeQuery, statusFilter, sortOrder }),
        [tasks, searchQuery, assigneeQuery, statusFilter, sortOrder]
    );

    return (
        <main className={styles.container}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Список задач</h1>
                <button className={styles.createBtn} onClick={openModal}>
                    + Добавить задачу
                </button>
            </div>

            <FilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                assigneeQuery={assigneeQuery}
                onAssigneeChange={setAssigneeQuery}
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
                    <div className={styles.errorMessage} role="alert">
                        <p>{error}</p>
                        <button type="button" className={styles.retryBtn} onClick={loadTasks}>
                            Повторить
                        </button>
                    </div>
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
                onClose={closeModal}
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