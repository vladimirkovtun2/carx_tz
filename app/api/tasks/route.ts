import { NextResponse } from "next/server";
import { readTasks, updateTasks } from "@/lib/tasks";
import { validateNewTask } from "@/lib/taskValidation";
import { Task } from "@/types/task";

// GET /api/tasks
export async function GET() {
    try {
        const tasks = await readTasks();
        return NextResponse.json(tasks);
    } catch {
        return NextResponse.json({ error: "Не удалось загрузить задачи" }, { status: 500 });
    }
}

// POST /api/tasks
export async function POST(request: Request) {
    try {
        const parsed = validateNewTask(await request.json().catch(() => null));
        if (!parsed.ok) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const newTask: Task = {
            id: crypto.randomUUID(),
            ...parsed.value,
            status: "Новая",
            result: "",
            createdAt: new Date().toISOString(),
            comments: [],
        };

        await updateTasks((tasks) => [newTask, ...tasks]);
        return NextResponse.json(newTask, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Не удалось создать задачу" }, { status: 500 });
    }
}