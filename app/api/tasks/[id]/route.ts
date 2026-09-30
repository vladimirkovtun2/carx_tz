import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Task, TASK_STATUSES, TASK_PRIORITIES } from "@/types/task";

const filePath = path.join(process.cwd(), "public", "tasks.json");

// Белый список: id и createdAt сюда не входят и физически не могут быть изменены
const ALLOWED_FIELDS = new Set([
    "title", "description", "assignee", "status", "result", "priority", "comments",
]);

async function getTasksFromFile(): Promise<Task[]> {
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function validatePatch(body: unknown): { value?: Partial<Task>; error?: string } {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return { error: "Тело запроса должно быть объектом" };
    }
    const record = body as Record<string, unknown>;

    const unknownFields = Object.keys(record).filter((k) => !ALLOWED_FIELDS.has(k));
    if (unknownFields.length > 0) {
        return { error: `Недопустимые поля: ${unknownFields.join(", ")}` };
    }

    const value: Record<string, unknown> = {};

    if ("title" in record) {
        if (typeof record.title !== "string" || !record.title.trim()) {
            return { error: "Название должно быть непустой строкой" };
        }
        value.title = record.title.trim();
    }
    if ("assignee" in record) {
        if (typeof record.assignee !== "string" || !record.assignee.trim()) {
            return { error: "Исполнитель должен быть непустой строкой" };
        }
        value.assignee = record.assignee.trim();
    }
    if ("description" in record) {
        if (typeof record.description !== "string") return { error: "Описание должно быть строкой" };
        value.description = record.description;
    }
    if ("result" in record) {
        if (typeof record.result !== "string") return { error: "Результат должен быть строкой" };
        value.result = record.result;
    }
    if ("status" in record) {
        if (!TASK_STATUSES.includes(record.status as Task["status"])) {
            return { error: "Недопустимый статус" };
        }
        value.status = record.status;
    }
    if ("priority" in record) {
        if (!TASK_PRIORITIES.includes(record.priority as Task["priority"])) {
            return { error: "Недопустимый приоритет" };
        }
        value.priority = record.priority;
    }
    if ("comments" in record) {
        if (!Array.isArray(record.comments) || record.comments.some((c) => typeof c !== "string")) {
            return { error: "Комментарии должны быть массивом строк" };
        }
        value.comments = record.comments;
    }

    return { value: value as Partial<Task> };
}

// GET /api/tasks/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tasks = await getTasksFromFile();
        const task = tasks.find((t) => t.id === id);

        if (!task) {
            return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
        }
        return NextResponse.json(task);
    } catch {
        return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
    }
}

// PATCH /api/tasks/[id]
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const tasks = await getTasksFromFile();

        const taskIndex = tasks.findIndex((t) => t.id === id);
        if (taskIndex === -1) {
            return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
        }

        const { value, error } = validatePatch(body);
        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        const updatedTask: Task = { ...tasks[taskIndex], ...value };
        tasks[taskIndex] = updatedTask;

        await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), "utf-8");
        return NextResponse.json(updatedTask);
    } catch {
        return NextResponse.json({ error: "Не удалось обновить задачу" }, { status: 500 });
    }
}

// DELETE /api/tasks/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tasks = await getTasksFromFile();
        const filteredTasks = tasks.filter((t) => t.id !== id);

        if (tasks.length === filteredTasks.length) {
            return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
        }

        await fs.writeFile(filePath, JSON.stringify(filteredTasks, null, 2), "utf-8");
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Не удалось удалить задачу" }, { status: 500 });
    }
}