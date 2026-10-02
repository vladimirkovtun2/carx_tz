После клонирования файлов из Git нужно с помощью консоли установить все пакеты: npm install

## Подключение Supabase
### Облако (продакшен, Vercel)
1. Создайте проект на https://supabase.com
2. В Dashboard откройте SQL Editor -> New query, вставьте содержимое `supabase/migrations/20261001144940_init.sql`, затем `supabase/seed.sql` и нажмите Run
3. В Project Settings -> Data API скопируйте Project URL и anon key
4. На Vercel задайте те же две переменные в Settings -> Environment Variables (Production) — `SUPABASE_URL` и `SUPABASE_ANON_KEY`

### Локальная разработка (свой Postgres в Docker)
1. Установите Docker Desktop и включите интеграцию с WSL2
2. Запустите `npx supabase start` — поднимет локальный Postgres + API и применит миграции и сид
3. Для `.env.local` возьмите значения из вывода команды (или `npx supabase status`):
   - `SUPABASE_URL` = Project URL (`http://127.0.0.1:64321`)
   - `SUPABASE_ANON_KEY` = Publishable key
   - Порты 6432x заданы в `supabase/config.toml`: стандартные 5432x заняты резервированием портов Windows (Hyper-V)
4. Вернуть локальную базу к исходному состоянию: `npx supabase db reset`
5. Остановить стек: `npx supabase stop`

Локальная БД доступна и напрямую: `postgresql://postgres:postgres@127.0.0.1:64322/postgres`, веб-интерфейс Studio: http://127.0.0.1:64323.

Схему меняем только миграциями: `npx supabase migration new <имя>`, затем выкатка в облако — `npx supabase db push`.

## Запуск
Для запуска в режиме разработки: npm run dev, после запуска страница будет на http://localhost:3000
Для сборки и запуска: npm run build, затем npm start
Для тестов: npm test
