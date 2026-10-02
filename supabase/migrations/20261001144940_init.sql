create table public.tasks (
    id          text primary key,
    title       text not null check (char_length(title) <= 200),
    description text not null default '',
    assignee    text not null check (char_length(assignee) <= 100),
    status      text not null default 'Новая' check (status in ('Новая', 'В работе', 'Выполнена')),
    result      text not null default '',
    priority    text not null default 'Средний' check (priority in ('Низкий', 'Средний', 'Высокий')),
    created_at  timestamptz not null default now(),
    comments    jsonb not null default '[]'::jsonb
);

-- Приложение ходит под anon-ключом, авторизации нет: разрешаем все операции.
-- Когда появится авторизация — заменить политики на проверку пользователя.
alter table public.tasks enable row level security;

create policy "tasks_all" on public.tasks
    for all to anon, authenticated
    using (true) with check (true);

grant select, insert, update, delete on public.tasks to anon, authenticated;
