import { describe, it, expect } from "vitest";
import { filterAndSortTasks } from "@/lib/filterTasks";
import { Task } from "@/types/task";

const base: Omit<Task, "id" | "title" | "assignee" | "status" | "createdAt"> = {
    description: "", result: "", priority: "Средний", comments: [],
};

const tasks: Task[] = [
    { ...base, id: "1", title: "Fix login bug", assignee: "Анна", status: "Новая", createdAt: "2026-09-01T10:00:00Z" },
    { ...base, id: "2", title: "Update docs", assignee: "Иван", status: "В работе", createdAt: "2026-09-03T10:00:00Z" },
    { ...base, id: "3", title: "Write tests", assignee: "Анна", status: "Выполнена", createdAt: "2026-09-02T10:00:00Z" },
];

const noFilters = { searchQuery: "", assigneeQuery: "", statusFilter: "Все" as const, sortOrder: "newest" as const };

describe("filterAndSortTasks", () => {
    it("фильтрует по названию без учёта регистра", () => {
        const r = filterAndSortTasks(tasks, { ...noFilters, searchQuery: "fix" });
        expect(r.map((t) => t.id)).toEqual(["1"]);
    });

    it("фильтрует по исполнителю", () => {
        const r = filterAndSortTasks(tasks, { ...noFilters, assigneeQuery: "анна" });
        expect(r.map((t) => t.id)).toEqual(["3", "1"]); // newest: 09-02 раньше 09-01? нет — сортировка по убыванию
    });

    it("фильтрует по статусу", () => {
        const r = filterAndSortTasks(tasks, { ...noFilters, statusFilter: "В работе" });
        expect(r.map((t) => t.id)).toEqual(["2"]);
    });

    it("сортирует от новых к старым и наоборот", () => {
        const asc = filterAndSortTasks(tasks, noFilters);
        const desc = filterAndSortTasks(tasks, { ...noFilters, sortOrder: "oldest" });
        expect(asc.map((t) => t.id)).toEqual(["2", "3", "1"]);
        expect(desc.map((t) => t.id)).toEqual(["1", "3", "2"]);
    });
});