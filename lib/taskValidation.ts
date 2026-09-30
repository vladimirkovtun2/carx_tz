import { Task, TASK_STATUSES, TASK_PRIORITIES, TaskPriority, TaskComment } from "@/types/task";

const ALLOWED_FIELDS = new Set([
    "title", "description", "assignee", "status", "result", "priority", "comments",
]);

// Защита от переполнения хранилища и нечитаемо длинных текстов
const LIMITS = {
    title: 200,
    assignee: 100,
    description: 2000,
    result: 2000,
    comment: 1000,
    commentsCount: 100,
} as const;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function isComment(value: unknown): value is TaskComment {
    if (typeof value !== "object" || value === null) return false;
    const record = value as Record<string, unknown>;
    return (
        typeof record.id === "string" &&
        record.id.length > 0 &&
        typeof record.text === "string" &&
        record.text.trim().length > 0 &&
        record.text.length <= LIMITS.comment
    );
}

export function validatePatch(body: unknown): Result<Partial<Task>> {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return { ok: false, error: "Тело запроса должно быть объектом" };
    }
    const record = body as Record<string, unknown>;

    const unknownFields = Object.keys(record).filter((k) => !ALLOWED_FIELDS.has(k));
    if (unknownFields.length > 0) {
        return { ok: false, error: `Недопустимые поля: ${unknownFields.join(", ")}` };
    }

    const value: Record<string, unknown> = {};

    if ("title" in record) {
        if (typeof record.title !== "string" || !record.title.trim())
            return { ok: false, error: "Название должно быть непустой строкой" };
        if (record.title.length > LIMITS.title)
            return { ok: false, error: `Название не должно превышать ${LIMITS.title} символов` };
        value.title = record.title.trim();
    }
    if ("assignee" in record) {
        if (typeof record.assignee !== "string" || !record.assignee.trim())
            return { ok: false, error: "Исполнитель должен быть непустой строкой" };
        if (record.assignee.length > LIMITS.assignee)
            return { ok: false, error: `Исполнитель не должен превышать ${LIMITS.assignee} символов` };
        value.assignee = record.assignee.trim();
    }
    if ("description" in record) {
        if (typeof record.description !== "string")
            return { ok: false, error: "Описание должно быть строкой" };
        if (record.description.length > LIMITS.description)
            return { ok: false, error: `Описание не должно превышать ${LIMITS.description} символов` };
        value.description = record.description;
    }
    if ("result" in record) {
        if (typeof record.result !== "string")
            return { ok: false, error: "Результат должен быть строкой" };
        if (record.result.length > LIMITS.result)
            return { ok: false, error: `Результат не должен превышать ${LIMITS.result} символов` };
        value.result = record.result;
    }
    if ("status" in record) {
        if (!TASK_STATUSES.includes(record.status as Task["status"]))
            return { ok: false, error: "Недопустимый статус" };
        value.status = record.status;
    }
    if ("priority" in record) {
        if (!TASK_PRIORITIES.includes(record.priority as Task["priority"]))
            return { ok: false, error: "Недопустимый приоритет" };
        value.priority = record.priority;
    }
    if ("comments" in record) {
        if (!Array.isArray(record.comments) || record.comments.length > LIMITS.commentsCount)
            return { ok: false, error: `Комментарии должны быть массивом не более ${LIMITS.commentsCount} элементов` };
        if (!record.comments.every(isComment))
            return { ok: false, error: "Комментарии должны быть объектами с непустыми id и text до 1000 символов" };
        value.comments = record.comments;
    }

    return { ok: true, value: value as Partial<Task> };
}

export function validateNewTask(body: unknown): Result<{
    title: string; description: string; assignee: string; priority: TaskPriority;
}> {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return { ok: false, error: "Тело запроса должно быть объектом" };
    }
    const record = body as Record<string, unknown>;

    if (typeof record.title !== "string" || !record.title.trim())
        return { ok: false, error: "Поле «название» обязательно" };
    if (record.title.length > LIMITS.title)
        return { ok: false, error: `Название не должно превышать ${LIMITS.title} символов` };
    if (typeof record.assignee !== "string" || !record.assignee.trim())
        return { ok: false, error: "Поле «исполнитель» обязательно" };
    if (record.assignee.length > LIMITS.assignee)
        return { ok: false, error: `Исполнитель не должен превышать ${LIMITS.assignee} символов` };
    if ("description" in record && typeof record.description !== "string")
        return { ok: false, error: "Описание должно быть строкой" };
    if (typeof record.description === "string" && record.description.length > LIMITS.description)
        return { ok: false, error: `Описание не должно превышать ${LIMITS.description} символов` };

    const priority = (record.priority ?? "Средний") as TaskPriority;
    if (!TASK_PRIORITIES.includes(priority))
        return { ok: false, error: "Недопустимый приоритет" };

    return {
        ok: true,
        value: {
            title: record.title.trim(),
            description: typeof record.description === "string" ? record.description : "",
            assignee: record.assignee.trim(),
            priority,
        },
    };
}
