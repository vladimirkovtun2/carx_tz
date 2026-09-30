import { Task, TaskStatus } from "@/types/task";

export interface TaskFilters {
    searchQuery: string;
    assigneeQuery: string;
    statusFilter: TaskStatus | "Все";
    sortOrder: "newest" | "oldest";
}

export function filterAndSortTasks(tasks: Task[], f: TaskFilters): Task[] {
    const title = f.searchQuery.toLowerCase();
    const assignee = f.assigneeQuery.toLowerCase();

    return tasks
        .filter((t) => t.title.toLowerCase().includes(title))
        .filter((t) => t.assignee.toLowerCase().includes(assignee))
        .filter((t) => f.statusFilter === "Все" || t.status === f.statusFilter)
        .sort((a, b) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            return f.sortOrder === "newest" ? db - da : da - db;
        });
}