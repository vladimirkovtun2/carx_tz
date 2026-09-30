import { NextResponse } from "next/server";
import { readTasks, updateTasks } from "@/lib/tasks";
import { validatePatch } from "@/lib/taskValidation";
import { Task } from "@/types/task";

// GET /api/tasks/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tasks = await readTasks();
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
        const parsed = validatePatch(await request.json().catch(() => null));
        if (!parsed.ok) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        // Мутация целиком внутри очереди записи
        let updatedTask: Task | null = null;
        await updateTasks((tasks) => {
            const task = tasks.find((t) => t.id === id);
            if (!task) return tasks;
            const next: Task = { ...task, ...parsed.value };
            updatedTask = next;
            return tasks.map((t) => (t.id === id ? next : t));
        });

        if (!updatedTask) {
            return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
        }
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

        let deleted = false;
        await updateTasks((tasks) => {
            const next = tasks.filter((t) => t.id !== id);
            deleted = next.length !== tasks.length;
            return next;
        });

        if (!deleted) {
            return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Не удалось удалить задачу" }, { status: 500 });
    }
}
