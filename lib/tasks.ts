import { getSupabase } from "@/lib/supabase";
import { Task, TaskComment } from "@/types/task";

// Строка таблицы tasks (snake_case), отдаваемая PostgREST
interface TaskRow {
    id: string;
    title: string;
    description: string;
    assignee: string;
    status: Task["status"];
    result: string;
    priority: Task["priority"];
    created_at: string;
    comments: TaskComment[] | null;
}

function toRow(task: Task): TaskRow {
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        status: task.status,
        result: task.result,
        priority: task.priority,
        created_at: task.createdAt,
        comments: task.comments,
    };
}

function toTask(row: TaskRow): Task {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        assignee: row.assignee,
        status: row.status,
        result: row.result,
        priority: row.priority,
        createdAt: row.created_at,
        comments: row.comments ?? [],
    };
}

// Очередь сериализует записи: запросы не теряют чужие изменения
let writeQueue: Promise<void> = Promise.resolve();

export async function readTasks(): Promise<Task[]> {
    const { data, error } = await getSupabase()
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as TaskRow[]).map(toTask);
}

// Приводит содержимое таблицы к переданному списку: upsert строк + удаление лишних id
async function syncTasks(tasks: Task[]): Promise<void> {
    const supabase = getSupabase();
    const ids = tasks.map((t) => t.id);

    let deleteQuery = supabase.from("tasks").delete();
    deleteQuery = ids.length > 0
        ? deleteQuery.not("id", "in", `(${ids.join(",")})`)
        : deleteQuery.not("id", "is", null); // пустой список — очистить таблицу

    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    if (tasks.length > 0) {
        const { error: upsertError } = await supabase
            .from("tasks")
            .upsert(tasks.map(toRow));
        if (upsertError) throw upsertError;
    }
}

export function writeTasks(tasks: Task[]): Promise<void> {
    const job = () => syncTasks(tasks);
    writeQueue = writeQueue.then(job, job);
    return writeQueue;
}

// Чтение-модификация-запись целиком внутри очереди:
// между чтением и записью не вклиниваются чужие изменения
export async function updateTasks(update: (tasks: Task[]) => Task[] | Promise<Task[]>): Promise<void> {
    const job = async () => syncTasks(await update(await readTasks()));
    writeQueue = writeQueue.then(job, job);
    await writeQueue;
}
