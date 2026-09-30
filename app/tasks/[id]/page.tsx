'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Task, TaskStatus } from "@/types/task";
import styles from "./task.module.less";

type PendingAction = "status" | "comment" | "delete" | null;

export default function TaskPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [commentText, setCommentText] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    // Последний неудачный переход статуса — для кнопки «Повторить»
    const [retryStatus, setRetryStatus] = useState<TaskStatus | null>(null);

    useEffect(() => {
        if (!id) return;

        const loadTask = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);
                const response = await fetch(`/api/tasks/${id}`);
                if (response.status === 404) {
                    router.replace("/");
                    return;
                }
                if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
                const data: Task = await response.json();
                setTask(data);
            } catch {
                setLoadError("Не удалось загрузить задачу.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTask();
    }, [id, router]);

    const handleStatusChange = async (status: TaskStatus) => {
        if (!task) return;
        try {
            setPendingAction("status");
            setStatusError(null);
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error();
            setTask(await response.json());
            setRetryStatus(null);
        } catch {
            setStatusError("Не удалось изменить статус.");
            setRetryStatus(status);
        } finally {
            setPendingAction(null);
        }
    };

    // Вынесена из onSubmit формы — тем же методом пользуется кнопка «Повторить»
    const submitComment = async () => {
        if (!task || !commentText.trim()) return;
        try {
            setPendingAction("comment");
            setCommentError(null);
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    comments: [...(task.comments ?? []), { id: crypto.randomUUID(), text: commentText.trim() }],
                }),
            });
            if (!response.ok) throw new Error();
            setTask(await response.json());
            setCommentText("");
        } catch {
            setCommentError("Не удалось отправить комментарий.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleAddComment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void submitComment();
    };

    const handleDelete = async () => {
        if (!task || !window.confirm("Удалить задачу? Действие нельзя отменить.")) return;
        try {
            setPendingAction("delete");
            setDeleteError(null);
            const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error();
            router.push("/");
        } catch {
            setDeleteError("Не удалось удалить задачу.");
        } finally {
            setPendingAction(null);
        }
    };

    if (isLoading) return <main className={styles.container}><p>Загрузка задачи...</p></main>;
    if (loadError) return <main className={styles.container}><p role="alert">{loadError}</p></main>;
    if (!task) return null;

    const isBusy = pendingAction !== null;

    return (
        <main className={styles.container}>
            <nav className={styles.navigation}>
                <button type="button" className={styles.backBtn} onClick={() => router.push("/")}>
                    ← Назад к списку
                </button>
                <button
                    type="button"
                    className={styles.deleteTaskBtn}
                    onClick={handleDelete}
                    disabled={isBusy}
                >
                    {pendingAction === "delete" ? "Удаление..." : "Удалить задачу"}
                </button>
            </nav>

            {deleteError && (
                <div className={styles.actionError} role="alert">
                    <span>{deleteError}</span>
                    <button type="button" className={styles.retryBtn} onClick={() => void handleDelete()}>
                        Повторить
                    </button>
                </div>
            )}

            <article className={styles.taskDetail}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{task.title}</h1>
                    <div className={styles.statusControl}>
                        <label htmlFor="status-change" className={styles.srOnly}>Изменить статус</label>
                        <select
                            id="status-change"
                            className={styles.statusSelect}
                            data-status={task.status}
                            value={task.status}
                            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                            disabled={pendingAction === "status" || pendingAction === "delete"}
                        >
                            <option value="Новая">Новая</option>
                            <option value="В работе">В работе</option>
                            <option value="Выполнена">Выполнена</option>
                        </select>
                    </div>
                </header>

                {statusError && (
                    <div className={styles.actionError} role="alert">
                        <span>{statusError}</span>
                        {retryStatus && (
                            <button
                                type="button"
                                className={styles.retryBtn}
                                onClick={() => void handleStatusChange(retryStatus)}
                            >
                                Повторить
                            </button>
                        )}
                    </div>
                )}

                <dl className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                        <dt>Исполнитель:</dt>
                        <dd>{task.assignee}</dd>
                    </div>
                    <div className={styles.metaItem}>
                        <dt>Приоритет:</dt>
                        <dd><strong>{task.priority}</strong></dd>
                    </div>
                    <div className={styles.metaItem}>
                        <dt>Дата создания:</dt>
                        <dd>{new Date(task.createdAt).toLocaleString("ru-RU")}</dd>
                    </div>
                </dl>

                <section className={styles.section}>
                    <h2>Описание</h2>
                    <p className={styles.description}>
                        {task.description || "Описание отсутствует."}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Комментарии ({task.comments?.length || 0})</h2>
                    {task.comments && task.comments.length > 0 ? (
                        <ul className={styles.commentList}>
                            {task.comments.map((comment) => (
                                <li key={comment.id} className={styles.commentItem}>{comment.text}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.noComments}>Комментариев пока нет.</p>
                    )}

                    <form onSubmit={handleAddComment} className={styles.commentForm}>
                        <label htmlFor="comment-input" className={styles.srOnly}>
                            Добавить комментарий
                        </label>
                        <textarea
                            id="comment-input"
                            placeholder="Напишите комментарий..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={isBusy}
                        />
                        <button
                            type="submit"
                            disabled={isBusy || !commentText.trim()}
                            className={styles.sendBtn}
                        >
                            {pendingAction === "comment" ? "Отправка..." : "Отправить"}
                        </button>
                    </form>

                    {commentError && (
                        <div className={styles.actionError} role="alert">
                            <span>{commentError}</span>
                            <button
                                type="button"
                                className={styles.retryBtn}
                                onClick={() => void submitComment()}
                                disabled={isBusy}
                            >
                                Повторить
                            </button>
                        </div>
                    )}
                </section>
            </article>
        </main>
    );
}