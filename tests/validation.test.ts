import { describe, it, expect } from "vitest";
import { validatePatch, validateNewTask } from "@/lib/taskValidation";

describe("validatePatch", () => {
    it("отклоняет неизвестные поля (в т.ч. id и createdAt)", () => {
        expect(validatePatch({ id: "hack" }).ok).toBe(false);
        expect(validatePatch({ createdAt: "2000-01-01" }).ok).toBe(false);
    });

    it("отклоняет невалидный статус и приоритет", () => {
        expect(validatePatch({ status: "Взломано" }).ok).toBe(false);
        expect(validatePatch({ priority: "Критический" }).ok).toBe(false);
    });

    it("отклоняет комментарии не-массивом", () => {
        expect(validatePatch({ comments: "одна строка" }).ok).toBe(false);
    });

    it("отклоняет комментарий без id или с пустым text", () => {
        expect(validatePatch({ comments: [{ text: "Привет" }] }).ok).toBe(false);
        expect(validatePatch({ comments: [{ id: "c1", text: "  " }] }).ok).toBe(false);
    });

    it("принимает валидные комментарии-объекты", () => {
        const r = validatePatch({ comments: [{ id: "c1", text: "Привет" }] });
        expect(r).toEqual({ ok: true, value: { comments: [{ id: "c1", text: "Привет" }] } });
    });

    it("принимает валидное частичное обновление", () => {
        const r = validatePatch({ status: "В работе" });
        expect(r).toEqual({ ok: true, value: { status: "В работе" } });
    });

    it("отклоняет слишком длинные строки", () => {
        expect(validatePatch({ title: "д".repeat(201) }).ok).toBe(false);
        expect(validatePatch({ assignee: "а".repeat(101) }).ok).toBe(false);
        expect(validatePatch({ description: "б".repeat(2001) }).ok).toBe(false);
        expect(validatePatch({ result: "в".repeat(2001) }).ok).toBe(false);
        expect(validatePatch({ comments: [{ id: "c1", text: "г".repeat(1001) }] }).ok).toBe(false);
        expect(validatePatch({ title: "д".repeat(200) }).ok).toBe(true);
    });
});

describe("validateNewTask", () => {
    it("требует название и исполнителя", () => {
        expect(validateNewTask({ assignee: "Иван" }).ok).toBe(false);
        expect(validateNewTask({ title: "  ", assignee: "Иван" }).ok).toBe(false);
    });

    it("валидирует приоритет и подставляет «Средний» по умолчанию", () => {
        expect(validateNewTask({ title: "T", assignee: "A", priority: "Критический" }).ok).toBe(false);
        const r = validateNewTask({ title: "T", assignee: "A" });
        expect(r.ok && r.value.priority).toBe("Средний");
    });

    it("отклоняет слишком длинные название, исполнителя и описание", () => {
        expect(validateNewTask({ title: "д".repeat(201), assignee: "Иван" }).ok).toBe(false);
        expect(validateNewTask({ title: "T", assignee: "а".repeat(101) }).ok).toBe(false);
        expect(validateNewTask({ title: "T", assignee: "Иван", description: "б".repeat(2001) }).ok).toBe(false);
    });
});
