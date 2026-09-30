import { useEffect, useRef, useState } from "react";
import { NewTaskPayload, TaskPriority } from "@/types/task";
import styles from "./CreateTaskModal.module.less";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (payload: NewTaskPayload) => Promise<void>;
}

export default function CreateTaskModal({ isOpen, onClose, onCreate }: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignee, setAssignee] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("Средний");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const overlayRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const restoreFocusRef = useRef<HTMLElement | null>(null);

    // Escape, удержание фокуса, начальный фокус на первое поле
    useEffect(() => {
        if (!isOpen) return;

        restoreFocusRef.current = document.activeElement as HTMLElement | null;
        setFormError(null);
        const focusTimer = setTimeout(() => titleInputRef.current?.focus(), 0);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== "Tab") return;

            const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
                'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            restoreFocusRef.current?.focus(); // возвращаем фокус на кнопку «+ Добавить задачу»
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title.trim() || !assignee.trim()) return;

        try {
            setIsSubmitting(true);
            setFormError(null);
            await onCreate({ title: title.trim(), description, assignee: assignee.trim(), priority });
            setTitle("");
            setDescription("");
            setAssignee("");
            setPriority("Средний");
            onClose();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Не удалось создать задачу. Попробуйте ещё раз.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={styles.modalContent} ref={overlayRef}>
                <h2 id="modal-title">Новая задача</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="task-title">Название *</label>
                        <input
                            id="task-title"
                            ref={titleInputRef}
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="task-assignee">Исполнитель *</label>
                        <input
                            id="task-assignee"
                            type="text"
                            required
                            value={assignee}
                            onChange={(e) => setAssignee(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="task-priority">Приоритет</label>
                        <select
                            id="task-priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        >
                            <option value="Низкий">Низкий</option>
                            <option value="Средний">Средний</option>
                            <option value="Высокий">Высокий</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="task-desc">Описание</label>
                        <textarea
                            id="task-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {formError && (
                        <p className={styles.formError} role="alert">{formError}</p>
                    )}

                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                            {isSubmitting ? "Сохранение..." : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}