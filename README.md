После клонирования файлов из Git нужно с помощью консоли установить все пакеты: npm install

## Подключение Supabase
1. Создайте проект на https://supabase.com
2. В Dashboard откройте SQL Editor -> New query, вставьте содержимое `supabase/seed.sql` и нажмите Run (создаст таблицу `tasks`, политики доступа и загрузит данные из старого `data/tasks.json`)
3. В Project Settings -> Data API скопируйте Project URL и anon key
4. Скопируйте `.env.example` в `.env.local` и вставьте туда эти значения

## Запуск
Для запуска в режиме разработки: npm run dev, после запуска страница будет на http://localhost:3000
Для сборки и запуска: npm run build, затем npm start
Для тестов: npm test
