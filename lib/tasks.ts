import { promises as fs } from "fs";
import path from "path";
import { Task } from "@/types/task";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "tasks.json");
const LEGACY_PATH = path.join(process.cwd(), "public", "tasks.json");

// Очередь сериализует записи: запросы не теряют чужие изменения
let writeQueue: Promise<void> = Promise.resolve();

async function writeFileAtomic(tasks: Task[]): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${FILE_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(tasks, null, 2), "utf-8");
    await fs.rename(tmp, FILE_PATH); // атомарно: при сбое не останется битый файл
}

export async function readTasks(): Promise<Task[]> {
    try {
        const raw = await fs.readFile(FILE_PATH, "utf-8");
        const data: unknown = JSON.parse(raw);
        return Array.isArray(data) ? (data as Task[]) : [];
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            // Одноразовая миграция из public/tasks.json
            try {
                const legacy = await fs.readFile(LEGACY_PATH, "utf-8");
                const data: unknown = JSON.parse(legacy);
                return Array.isArray(data) ? (data as Task[]) : [];
            } catch {
                return [];
            }
        }
        throw err;
    }
}

export function writeTasks(tasks: Task[]): Promise<void> {
    const job = () => writeFileAtomic(tasks);
    writeQueue = writeQueue.then(job, job);
    return writeQueue;
}

// Чтение-модификация-запись целиком внутри очереди:
// между чтением и записью не вклиниваются чужие изменения
export async function updateTasks(update: (tasks: Task[]) => Task[] | Promise<Task[]>): Promise<void> {
    const job = async () => writeFileAtomic(await update(await readTasks()));
    writeQueue = writeQueue.then(job, job);
    await writeQueue;
}