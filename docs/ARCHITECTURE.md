# Architecture

Приложение — фронтенд Next.js 16 поверх **неизменного** Fastify REST API по
паттерну **BFF (Backend-for-Frontend)**. Fastify слушает `:3000`, Next — `:3001`.
Браузер никогда не ходит в Fastify напрямую: все вызовы идут сервер-к-серверу из
Next-процесса. Единственный источник правды по типам — OpenAPI-спека Fastify,
из неё генерируется `src/lib/api/schema.d.ts` (`npm run gen:api`).

## 1. Каркас и BFF-фундамент

- **BFF-паттерн.** Next владеет браузером, Fastify остаётся «чистым» API за ним.
  CORS не задействован (нет прямых браузерных запросов к Fastify).
- **Порты 3000/3001** — Next на 3001, чтобы не конфликтовать с Fastify на 3000.
- **Типизированный клиент из OpenAPI.** `openapi-fetch` поверх сгенерированных
  типов даёт end-to-end типобезопасность: меняется схема Fastify → `gen:api` →
  TypeScript краснеет на несоответствиях.
- **`server-only`** на API-клиенте — предохранитель от утечки клиента (и env) в
  браузерный бандл.
- **Валидация env через zod** с разделением server/client: `API_INTERNAL_URL`
  недоступна на клиенте, `NEXT_PUBLIC_*` — инлайнятся.
- **Cache Components с первого коммита** (`cacheComponents: true`): всё
  динамическое по умолчанию, кеш — opt-in. Отсюда PPR: статический shell +
  стриминг в `<Suspense>`.
- **Отступления от исходного плана (вынужденные под этот стек):**
  - Пустой auth-middleware НЕ регистрируется: с зарегистрированным middleware
    `openapi-fetch` дёргает `Math.random()` для id запроса, что запрещено в
    prerender и внутри `'use cache'`. Регистрируется позже, в авторизованном
    клиенте (раздел 4).
  - ESLint — плоский конфиг `eslint-config-next` напрямую (в v16 это уже
    flat-config), без `FlatCompat`.

## 2. Роутинг и рендеринг

- **Файловые соглашения App Router:** `layout`/`template`/`page`/`loading`/
  `error`/`not-found`, route group `(shop)` (общий UI без сегмента в URL),
  динамические сегменты `[id]`, опциональный catch-all `[[...filters]]`,
  приватные `_components`.
- **Граница Server/Client.** Данные тянутся на сервере (Server Components),
  интерактивность — «острова» Client Components; **состояние живёт в URL**
  (селектор размера страницы пишет в query, страница перерисовывается на сервере).
- **`loading.tsx` = автоматический `<Suspense>`** для сегмента: статический shell
  layout'а виден сразу, контент подъезжает.
- **Metadata API:** статический + `generateMetadata` (title, OpenGraph) на данных
  товара.
- **Согласование с реальным контрактом Fastify:**
  - Пути со слэшем: `/api/v1/products/`, `/api/v1/products/{id}/`.
  - `getProductsPage`/`listProducts` идут через `unwrap`: у list-эндпоинта в
    схеме только 200 → `openapi-fetch` схлопывает ветку error и `response`
    становится `never`.
  - `getProduct` мапит и 404 (нет товара), и 400 (кривой uuid) в `null` →
    страница «Товар не найден».

## 3. Cache Components целиком

- **Три корзины рендеринга:** static (синхронный код), cached (`'use cache'` +
  `cacheLife`), dynamic (`<Suspense>`, стрим). Границы расставляются осознанно.
- **Кастомные профили `cacheLife`** (`product`, `productList`) с таймингами
  stale/revalidate/expire. Короткий профиль (`seconds`) автоматически становится
  «динамической дырой».
- **`'use cache'` на слое данных**, ключ кеша — из аргументов функции. Важный
  инсайт: динамическая страница (читает `searchParams`) может брать данные из
  кешированной функции — «динамический рендер» ≠ «некешированные данные».
- **Стратегия тегов** (`cache-tags.ts`): широкий `products` + точечный
  `product-${id}`; `revalidateTag` (фоновый SWR, 2 арг) против `updateTag`
  (немедленный read-your-writes, только из Server Action — подключается вместе с
  мутациями).
- **`generateStaticParams`** на странице товара — обязателен под Cache Components
  (≥1 param); заодно закрыл реальный баг из раздела 2 (чтение `params` вне
  Suspense). `dynamicParams` = true → ISR для товаров, добавленных после билда.
- **PPR-тюнинг:** статический shell товара (название/цена/описание из кеша) +
  живой остаток как отдельная динамическая дыра в `<Suspense>`.
- Тестировать кеш только в production-режиме (`build && start`): в dev поведение
  отличается.

## 4. Аутентификация

- **Трёхслойная модель безопасности:** (1) `proxy.ts` — оптимистичные редиректы,
  **НЕ граница безопасности**; (2) Server Actions — публичные POST-эндпоинты,
  **каждый сам проверяет сессию**; (3) Fastify — финальный гейт (валидирует
  подпись JWT на каждом запросе).
- **BFF-поток cookie.** Логин сервер-к-серверу → токены из тела ответа Fastify →
  Next кладёт `mp_access`/`mp_refresh` в **свои** httpOnly-cookie (cookie Fastify
  игнорируем). Серверный код форвардит `mp_access` как `Bearer`.
- **Разделение API-клиента** (следствие Cache Components: внутри `'use cache'`
  нельзя читать `cookies()`):
  - `apiPublic` — без cookie, безопасен в `'use cache'` (товары, auth-эндпоинты);
  - `apiAuthed` — читает cookie и шлёт Bearer, только в динамических компонентах
    и Server Actions.
- **`getCurrentUser` на React `cache()`** — дедуп в пределах запроса для
  рантайм-данных за cookie (в отличие от персистентного `'use cache'`).
- **`proxy.ts`** на Node-рантайме: оптимистичный гейт защищённых маршрутов +
  проактивный refresh access-токена (декод payload нативным `Buffer` без
  верификации подписи). `config` — строго статический объектный литерал (каст
  ломает статический разбор Next). Новый access прокидывается и в **запрос**
  (`NextResponse.next({ request })` + `request.cookies.set`), чтобы рендер того же
  запроса не словил 401 и не увёл на `/login`.
- **Защита под Cache Components.** Сессионные маршруты читают cookie → динамика,
  нужен `<Suspense>`. Логин/регистрация закрыты `(auth)/loading.tsx`. Layout,
  читающий cookie, требует **собственный** Suspense (loading.tsx оборачивает
  только страницу) — поэтому `(protected)/layout.tsx` выносит проверку в
  `AuthGate` внутри `<Suspense>`.
- **Индикатор пользователя в шапке** — динамическая дыра (`UserNav` в `<Suspense>`),
  остальная шапка остаётся статическим shell'ом (в духе PPR из раздела 3).
- **Отступление:** `taint`-API (`experimental_taintObjectReference`) **не
  используется** — в стабильном React 19.2 функции не экспортируются (есть только
  в `react@experimental`, иначе рантайм-краш). Реальную защиту токена дают
  httpOnly-cookie (JS его не видит) + `server-only`-модули; дисциплина «в Client
  Component — только нужные поля user, не объект целиком» соблюдается вручную.
- **Безопасность версии:** нижняя граница `next` поднята до `^16.2.6` (майский
  релиз 2026 закрыл CVE с обходом аутентификации).

## 5. Мутации и формы

- **Server Actions на все мутации.** Каждый — публичный POST-эндпоинт, поэтому
  **сам проверяет сессию** (`getCurrentUser`). Известные ошибки (валидация,
  бизнес) возвращаются в объекте состояния и показываются в форме; неожиданные —
  `throw` (ловит `error.tsx` из раздела 2).
- **Инвалидация кеша замыкает раздел 3.** После мутации — `revalidateTag`
  (строго 2 аргумента: тег + профиль, напр. `"max"`): широкий `products` для
  списков, точечный `product-${id}` для карточки. Теги наконец окупаются.
- **`useActionState`** (state, dispatch, isPending) + **`useFormStatus`** в
  дочернем компоненте (кнопка submit читает статус родительской `<form>`).
  Репопуляция формы после ошибки — через `defaultValue` из `state.values`.
  Прогрессивное улучшение: форма отправляется POST'ом и работает без JS.
- **`next/form` — только навигационные формы.** Поиск: `<Form action="/products">`
  делает GET-переход на `/products?q=…` с префетчем и клиентской навигацией
  (Server Component, без `'use client'`). Фильтрация идёт по загруженной странице
  (у Fastify нет search-эндпоинта; на сервере готов GIN-индекс `pg_trgm` под
  будущий `/products/search`). Для мутаций — обычный `<form>` + Server Action.
- **`useOptimistic` + `startTransition`.** Контракт отката: оптимистичное
  состояние откатывается **только при `throw`**, поэтому `deleteProductAction`
  бросает (403/404), а не возвращает объект ошибки. Жизненный цикл: оптимизм →
  `revalidateTag` → сходимость к свежему базовому значению.
- **Загрузка изображений.** `experimental.serverActions.bodySizeLimit: "16mb"`
  (лимит по сырому телу). Server Action форвардит multipart в Fastify
  `/products/{id}/images` **сырым `fetch`** (openapi-fetch неудобен, а эндпоинт в
  схеме без типизированного тела); `Content-Type` не ставим вручную — `fetch` сам
  задаёт boundary. **Клиентская проверка размера обязательна**: при превышении
  лимита action падает молча, ещё до своего кода. `.bind(null, productId)`
  передаёт доп-аргумент первым параметром.
- **Route groups не конфликтуют по путям.** `(shop)/products/[id]` (публичная
  карточка) и `(protected)/products/[id]/manage` (загрузка картинок под AuthGate)
  сосуществуют — пути разные, а защита у второго от layout'а группы `(protected)`.

## 6. Реалтайм и продвинутый роутинг

- **WebSocket — единственное прямое общение браузера с Fastify.** Auth решается
  тикетом: Server Action `getAuctionTicket` читает access-токен из httpOnly-cookie
  и отдаёт клиенту для handshake (Fastify ждёт JWT в query). Это единственное
  место, где токен попадает в JS клиента: короткоживущий, только для handshake,
  при обрыве берётся свежий. Аукционы в Fastify ключуются по `productId`.
- **Хук сокета** с авто-реконнектом, cleanup при unmount и разбором событий
  `auction:state` / `bid:placed` / `bid:rejected` / `auction:ended` (контракт
  сверен пробой реального WS). Реконнект вызывает `connect` через ref — иначе
  `useCallback` ссылался бы на себя (ошибка react-hooks).
- **Ручная оптимистика ставок** (`useState`), а не `useOptimistic`: ставка идёт по
  WebSocket, а не через Server Action. Реконсиляция вручную: `bid:placed`
  подтверждает и снимает оптимизм, `bid:rejected` откатывает.
- **Parallel routes**: слот `@modal` в layout'е `(shop)` + обязательный
  `default.tsx` (→ null) для неперехваченных маршрутов. **Intercepting route**
  `(.)products/[id]`: soft-навигация из списка → модалка в слоте поверх списка;
  прямой URL или refresh → полная страница. Deep-linkable: URL всегда
  `/products/[id]`.
- **SSE через стриминговый Route Handler** `/api/stream` (`ReadableStream`,
  `text/event-stream`, cleanup по `request.signal`) — односторонний поток как
  альтернатива WS; клиент через `EventSource`. Route помечается динамическим (ƒ).
- **Отступления:** `<ViewTransition>` не используется — компонент отсутствует в
  стабильном React 19.2 (только в `react@experimental`, иначе рантайм-краш), как и
  taint из раздела 4. `Activity` в React 19.2 доступен, но демо-обёртка не
  подключалась.

## 7. Route Handlers и BFF-слой

- **Развилка инструментов:** Server Action — мутации изнутри Next; Route Handler —
  HTTP-эндпоинт для ВНЕШНИХ потребителей (вебхуки, мобильные, публичный JSON) и
  стриминга; прямой fetch в Server Component — чтение для рендера.
- **GET-хендлеры под Cache Components:** динамический handler (читает `request.url`
  или cookie) ≠ некешированные данные — данные берутся из `'use cache'`-хелпера
  (`getProductsPage`). Грабля: `'use cache'` нельзя в теле handler'а, только в
  хелпере.
- **BFF-агрегация** `/api/mobile/products/[id]`: товар + ставки параллельно
  (`Promise.all`), форвардинг Bearer из cookie; `OPTIONS` — CORS-префлайт.
- **Вебхуки:** публичный POST с HMAC-подписью (`timingSafeEqual` + сверка длины);
  `revalidateTag` (2 арг), НЕ `updateTag` (тот только из Server Action); `after()`
  выполняет тяжёлую работу после ответа клиенту.
- **Draft Mode:** асинхронный `draftMode()`; при включении все `'use cache'`
  пере-выполняются мимо кеша (предпросмотр свежих данных). Вход по секрету, цель
  redirect санитизируется до внутренних путей (иначе open redirect).
- **OG-картинки:** `next/og` `ImageResponse` (Satori → PNG без headless-браузера),
  `generateStaticParams` под Cache Components. **`metadataBase`** в корневом layout
  обязателен — без него абсолютные `og:image` резолвятся на дефолтный
  `localhost:3000` (это Fastify), а не на Next-приложение.
- **Метафайлы** `sitemap.ts` / `robots.ts` / `manifest.ts` на данных Fastify
  кешируются по умолчанию — поэтому исключены из matcher `proxy.ts`.
