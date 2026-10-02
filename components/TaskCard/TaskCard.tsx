import Link from "next/link";
import StatusBadge from "../StatusBadge/StatusBadge";
import { Task } from "@/types/task";
import styles from "./TaskCard.module.less";

interface TaskCardProps {
    task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
    return (
        <li className={styles.taskCard}>
            <div className={styles.taskHeader}>
                <Link href={`/tasks/${task.id}`} className={styles.taskTitle}>
                    {task.title}
                </Link>
                <StatusBadge status={task.status} />
            </div>
            <div className={styles.taskMeta}>
                <span>Приоритет: <strong>{task.priority}</strong></span>
                <span>•</span>
                <span>Исполнитель: {task.assignee}</span>
                <span>•</span>
                <span>Дата: {new Date(task.createdAt).toLocaleDateString("ru-RU")}</span>
            </div>
            {task.result && <p className={styles.taskResult}>{task.result}</p>}
        </li>
    );
}