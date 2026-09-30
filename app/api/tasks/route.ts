import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Task } from "@/types/task";

const filePath = path.join(process.cwd(), "public", "tasks.json");

// Вспомогательная функция чтения файла
async function getTasksFromFile(): Promise<Task[]> {
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// GET /api/tasks — получение списка задач
export async function GET() {
    try {
        const tasks = await getTasksFromFile();
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Ошибка чтения файла:", error);
        return NextResponse.json(
            { error: "Не удалось получить список задач" },
            { status: 500 }
        );
    }
}

// POST /api/tasks — создание новой задачи
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, assignee, priority } = body;

        // Валидация обязательных полей
        if (!title?.trim() || !assignee?.trim()) {
            return NextResponse.json(
                { error: "Поля 'Название' и 'Исполнитель' обязательны для заполнения" },
                { status: 400 }
            );
        }

        const tasks = await getTasksFromFile();

        const newTask: Task = {
            id: Date.now().toString(),
            title: title.trim(),
            description: description?.trim() || "",
            assignee: assignee.trim(),
            status: "Новая",
            result: "",
            priority: priority || "Средний",
            createdAt: new Date().toISOString(),
            comments: [],
        };

        // Добавляем новую задачу в начало списка
        tasks.unshift(newTask);

        await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), "utf-8");

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error("Ошибка записи файла:", error);
        return NextResponse.json(
            { error: "Не удалось сохранить новую задачу" },
            { status: 500 }
        );
    }
}