import { describe, it, expect, vi, beforeEach } from "vitest";
import { Task } from "@/types/task";

// Хранилище в памяти вместо таблицы tasks в Supabase — роуты работают с ним как с базой
const store = vi.hoisted(() => ({ tasks: [] as Task[] }));

vi.mock("@/lib/tasks", () => ({
    readTasks: vi.fn(async () => store.tasks),
    writeTasks: vi.fn(async (tasks: Task[]) => {
        store.tasks = tasks;
    }),
    updateTasks: vi.fn(async (update: (tasks: Task[]) => Task[]) => {
        store.tasks = update(store.tasks);
    }),
}));

import { GET as GET_LIST, POST } from "@/app/api/tasks/route";
import { GET, PATCH, DELETE } from "@/app/api/tasks/[id]/route";

const makeTask = (overrides: Partial<Task> = {}): Task => ({
    id: crypto.randomUUID(),
    title: "Задача",
    description: "",
    assignee: "Иван",
    status: "Новая",
    result: "",
    priority: "Средний",
    createdAt: "2026-09-01T10:00:00Z",
    comments: [],
    ...overrides,
});

const jsonRequest = (method: string, body: unknown, path = "http://localhost/api/tasks") =>
    new Request(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
    store.tasks = [makeTask({ id: "1", title: "Первая" }), makeTask({ id: "2", title: "Вторая" })];
});

describe("GET /api/tasks", () => {
    it("возвращает список задач", async () => {
        const res = await GET_LIST();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveLength(2);
    });

    it("возвращает 500 при сбое чтения", async () => {
        const { readTasks } = await import("@/lib/tasks");
        vi.mocked(readTasks).mockRejectedValueOnce(new Error("disk error"));
        const res = await GET_LIST();
        expect(res.status).toBe(500);
    });
});

describe("POST /api/tasks", () => {
    it("создаёт задачу с серверными полями", async () => {
        const res = await POST(jsonRequest("POST", { title: "Новая задача", assignee: "Пётр" }));
        expect(res.status).toBe(201);
        const task = await res.json();
        expect(task.id).toBeTruthy();
        expect(task.status).toBe("Новая");
        expect(task.result).toBe("");
        expect(task.comments).toEqual([]);
        expect(store.tasks).toHaveLength(3);
        expect(store.tasks[0].title).toBe("Новая задача");
    });

    it("отклоняет задачу без названия", async () => {
        const res = await POST(jsonRequest("POST", { assignee: "Пётр" }));
        expect(res.status).toBe(400);
        expect(store.tasks).toHaveLength(2);
    });

    it("отклоняет битый JSON", async () => {
        const res = await POST(new Request("http://localhost/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ не json",
        }));
        expect(res.status).toBe(400);
    });
});

describe("GET /api/tasks/[id]", () => {
    it("возвращает задачу по id", async () => {
        const res = await GET(new Request("http://localhost/api/tasks/1"), params("1"));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.id).toBe("1");
    });

    it("возвращает 404 для отсутствующей задачи", async () => {
        const res = await GET(new Request("http://localhost/api/tasks/999"), params("999"));
        expect(res.status).toBe(404);
    });
});

describe("PATCH /api/tasks/[id]", () => {
    it("обновляет разрешённое поле", async () => {
        const res = await PATCH(jsonRequest("PATCH", { status: "В работе" }, "http://localhost/api/tasks/1"), params("1"));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("В работе");
        expect(store.tasks.find((t) => t.id === "1")?.status).toBe("В работе");
    });

    it("обновляет результат задачи", async () => {
        const res = await PATCH(jsonRequest("PATCH", { result: "Готово, протестировано" }, "http://localhost/api/tasks/1"), params("1"));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.result).toBe("Готово, протестировано");
        expect(store.tasks.find((t) => t.id === "1")?.result).toBe("Готово, протестировано");
    });

    it("отклоняет попытку изменить id или createdAt", async () => {
        expect((await PATCH(jsonRequest("PATCH", { id: "hack" }), params("1"))).status).toBe(400);
        expect((await PATCH(jsonRequest("PATCH", { createdAt: "2000-01-01" }), params("1"))).status).toBe(400);
        expect(store.tasks.find((t) => t.id === "1")?.id).toBe("1");
    });

    it("отклоняет невалидный статус и приоритет", async () => {
        expect((await PATCH(jsonRequest("PATCH", { status: "Взломано" }), params("1"))).status).toBe(400);
        expect((await PATCH(jsonRequest("PATCH", { priority: "Критический" }), params("1"))).status).toBe(400);
    });

    it("добавляет валидный комментарий", async () => {
        const res = await PATCH(
            jsonRequest("PATCH", { comments: [{ id: "c1", text: "Комментарий" }] }),
            params("1")
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.comments).toEqual([{ id: "c1", text: "Комментарий" }]);
    });

    it("отклоняет комментарий без id", async () => {
        const res = await PATCH(jsonRequest("PATCH", { comments: [{ text: "Без id" }] }), params("1"));
        expect(res.status).toBe(400);
    });

    it("возвращает 404 для отсутствующей задачи", async () => {
        const res = await PATCH(jsonRequest("PATCH", { status: "В работе" }), params("999"));
        expect(res.status).toBe(404);
    });
});

describe("DELETE /api/tasks/[id]", () => {
    it("удаляет задачу", async () => {
        const res = await DELETE(new Request("http://localhost/api/tasks/1", { method: "DELETE" }), params("1"));
        expect(res.status).toBe(200);
        expect(store.tasks).toHaveLength(1);
        expect(store.tasks.some((t) => t.id === "1")).toBe(false);
    });

    it("возвращает 404 для отсутствующей задачи", async () => {
        const res = await DELETE(new Request("http://localhost/api/tasks/999", { method: "DELETE" }), params("999"));
        expect(res.status).toBe(404);
        expect(store.tasks).toHaveLength(2);
    });
});
