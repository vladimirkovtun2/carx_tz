export type TaskStatus = "Новая" | "В работе" | "Выполнена";
export type TaskPriority = "Низкий" | "Средний" | "Высокий";

export interface TaskComment {
    id: string;
    text: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assignee: string;
    status: TaskStatus;
    result: string;
    priority: TaskPriority;
    createdAt: string;
    comments: TaskComment[];
}

export interface NewTaskPayload {
    title: string;
    description: string;
    assignee: string;
    priority: TaskPriority;
}

export const TASK_STATUSES: readonly TaskStatus[] = ["Новая", "В работе", "Выполнена"];
export const TASK_PRIORITIES: readonly TaskPriority[] = ["Низкий", "Средний", "Высокий"];