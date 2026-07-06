# rt-marketplace-web

Next.js 16 (App Router, Turbopack, Cache Components) фронтенд поверх неизменного
Fastify API по паттерну **BFF (Backend-for-Frontend)**. Браузер никогда не ходит в
Fastify REST напрямую — все вызовы идут server-to-server из Next.

Это **Этап 1**: скелет, конфигурация и типизированный `apiClient` к Fastify.

## Стек

- **Next.js 16** — App Router, Turbopack по умолчанию, `cacheComponents: true` (PPR).
- **React 19.2**.
- **Tailwind CSS v4** — CSS-first конфигурация (`@theme` в `globals.css`, без `tailwind.config`).
- **zod** — валидация переменных окружения с разделением server/client.
- **openapi-fetch** + **openapi-typescript** — типизированный клиент; типы генерируются
  из OpenAPI-спеки Fastify (один источник правды на два репозитория).
- **server-only** — предохранитель от утечки серверного клиента в браузерный бандл.

## Порты

- Fastify (API) — `:3000`
- Next (это приложение) — `:3001` (чтобы не конфликтовать с Fastify)

## Быстрый старт

```bash
# 1. Поднять Fastify-стек в его репозитории (нужен для типов и данных):
#    docker compose up -d && npm run db:migrate && npm run dev   # Fastify на :3000

# 2. Здесь:
npm install
cp .env.example .env.local        # уже создан
npm run gen:api                   # генерирует src/lib/api/schema.d.ts из OpenAPI Fastify
npm run dev                       # Next на http://localhost:3001
```

> ⚠️ `src/lib/api/schema.d.ts` сейчас — **плейсхолдер** (ручной набросок типов),
> чтобы проект компилировался без запущенного Fastify. Как только сервер поднят,
> выполните `npm run gen:api`, и файл заменится реальными типами из спеки.

## Скрипты

| Скрипт             | Что делает                                                    |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Dev-сервер (Turbopack) на `:3001`                            |
| `npm run build`    | Продакшн-сборка                                              |
| `npm run start`    | Запуск собранного приложения на `:3001`                     |
| `npm run lint`     | ESLint (flat-config, `eslint-config-next`)                  |
| `npm run typecheck`| `tsc --noEmit`                                              |
| `npm run gen:api`  | Генерация типов из `http://localhost:3000/docs/json`        |

## Проверка сквозного конвейера

Открыть `http://localhost:3001` — статический заголовок появляется мгновенно
(PPR-shell), блок «Последние товары» стримится в `<Suspense>`. Если Fastify не
запущен — красное сообщение об ошибке (сработал `ApiError`). Создать товар:

```bash
curl -X POST http://localhost:3000/api/v1/products/ \
  -H 'Content-Type: application/json' \
  -d '{"title":"Кофемолка","priceCents":4990,"stock":10}'
```

> Реальный контракт Fastify (из OpenAPI): список товаров — `GET /api/v1/products/`
> (со слэшем), query `{ limit: number, cursor?: string }`, ответ
> `{ items: Product[], nextCursor: string | null }`. Тип пути в клиенте должен
> совпадать со слэшем — иначе `openapi-fetch` не найдёт его в `paths`.
