# Changelog

## 1. Каркас и BFF-фундамент

- Next.js 16 (App Router, Turbopack, `cacheComponents` + PPR).
- Типизированный `openapi-fetch`-клиент; генерация типов из OpenAPI Fastify
  (`npm run gen:api`).
- Валидация переменных окружения через zod (server/client), Tailwind v4
  (CSS-first), самохостинг шрифта Inter, `server-only` на клиенте.
- ESLint на flat-config `eslint-config-next`.
- Главная `/` со стримингом превью товаров в `<Suspense>`.

## 2. Роутинг и рендеринг

- Route group `(shop)`, общий `layout` + `template`.
- Список `/products` (курсорная пагинация, селектор размера страницы) и карточка
  `/products/[id]` с `generateMetadata` (OpenGraph).
- Опциональный catch-all `/catalog/[[...filters]]`.
- Границы `loading` / `error` / `not-found` по сегментам.
- Слой данных (`getProduct`, `listProducts`), `formatPrice`, алиасы типов.
- Инфраструктура: `typedRoutes`, корневые `error.tsx` / `not-found.tsx`, обёртка
  `gen:api` с проверкой доступности Fastify.

## 3. Cache Components

- Кастомные профили `cacheLife` (`product`, `productList`).
- Слой данных на `'use cache'`: `getProduct`, `getProductsPage`,
  `getProductStock`.
- `generateStaticParams` на карточке товара (prerender shell'ов, ISR через
  `dynamicParams`).
- Живой остаток стримится отдельной динамической дырой (PPR).
- Модуль тегов `cache-tags.ts` (`revalidateTag` / `updateTag`).

## 4. Аутентификация

- Разделение API-клиента: `apiPublic` (безопасен в `'use cache'`) и `apiAuthed`
  (Bearer из cookie); общий `http.ts` (`ApiError` / `unwrap`).
- Cookie-сессия `mp_access` / `mp_refresh` (httpOnly), `getCurrentUser`
  (React `cache()`).
- Server Actions `login` / `register` / `logout`; страницы `/login`, `/register`.
- Защищённая группа `(protected)` (AuthGate), `/account`, индикатор пользователя
  в шапке.
- `proxy.ts` — оптимистичный гейт маршрутов и проактивный refresh токена.
- Нижняя граница `next` поднята до `^16.2.6` (закрытые CVE с обходом auth).

## 5. Мутации и формы

- Создание товара `/sell` (Server Action, `useActionState`, ошибки по полям,
  инвалидация кеша).
- Поиск на `/products` через `next/form`.
- Оптимистичное удаление `/manage` (`useOptimistic`).
- Загрузка изображений `/products/[id]/manage` (форвардинг multipart в Fastify).
- `experimental.serverActions.bodySizeLimit`; `proxy` защищает `/manage`.

## 6. Реалтайм и продвинутый роутинг

- WS-аукционы: хук `use-auction-socket` (авто-реконнект, схематизированные
  события), панель ставок с ручной оптимистикой, страница `/auctions/[id]`.
- Auth для WS через тикет-Server Action `getAuctionTicket`; `NEXT_PUBLIC_WS_URL`.
- Parallel route: слот `@modal` (+ `default.tsx`) и intercepting route
  `(.)products/[id]` — модалка карточки товара поверх списка.
- SSE: стриминговый Route Handler `/api/stream` и клиент `LiveTicker`.

## 7. Route Handlers и BFF-слой

- Кешируемый GET-эндпоинт `/api/products` (данные через `'use cache'`-хелпер).
- BFF-агрегация `/api/mobile/products/[id]` — товар и ставки одним ответом,
  CORS-префлайт `OPTIONS`.
- Вебхук `/api/webhooks/revalidate` — HMAC-подпись, `after()`, `revalidateTag`.
- Draft Mode: `/api/draft` (вход по секрету) и `/api/draft/disable`; баннер
  предпросмотра на `/products`.
- OG-картинки `products/[id]/opengraph-image` через `next/og` (Satori → PNG).
- Динамические `sitemap.ts`, `robots.ts`, `manifest.ts` на данных Fastify.
- `metadataBase` в корневом layout; matcher `proxy` исключает метафайлы; секреты
  `WEBHOOK_SECRET` / `DRAFT_SECRET`.

## 8. Оптимизация и продакшен

- `next/image` для фото товара на карточке товара: `images.remotePatterns` на
  storage Fastify (`/static/**`), `qualities: [75]`, `dangerouslyAllowLocalIP` для
  localhost в dev; хелпер `getProductImages`.
- Ленивая аукционная панель через `next/dynamic` (`ssr: false`) в клиентской
  обёртке — отдельный чанк, код грузится только на клиенте.
- React Compiler (`reactCompiler: true`) и `@next/bundle-analyzer`
  (`ANALYZE=true npm run build`).
- Сквозная трассировка: `instrumentation.ts` на `@vercel/otel` экспортирует в тот
  же Jaeger, что и Fastify; `instrumentation-client.ts` — клиентская телеметрия.
- `global-error.tsx` — перехват ошибок корневого layout.
- Общий кеш через Redis: `cache-handlers/redis-handler.cjs` под интерфейс
  `cacheHandlers`, подключается флагом `DOCKER_BUILD`.
- i18n: словари `ru`/`en` с ленивой подгрузкой и определением локали по
  `Accept-Language` (`src/lib/i18n.ts`).
- Тесты: Vitest (`format`, `i18n`) и Playwright (`e2e/`); скрипты `test`,
  `test:e2e`, `analyze`.
- Продакшен: `output: 'standalone'` (флаг `DOCKER_BUILD`), `Dockerfile`,
  `docker-compose.web.yml`, `.dockerignore`; CI GitHub Actions; серверные env
  `REDIS_URL` / `OTEL_*`.
