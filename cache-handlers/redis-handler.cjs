// Кеш-хендлер для директив `use cache` (интерфейс cacheHandlers, Next 16).
// Хранит записи в общем Redis, чтобы несколько инстансов Next делили кеш, а
// revalidateTag распространялся между репликами. Подключается в next.config.ts
// под флагом DOCKER_BUILD.
//
// .cjs, а не .js: проект — ESM ("type":"module"), а хендлер грузится как CommonJS
// (require redis, module.exports). Расширение снимает неоднозначность.
//
// Хендлер ОБЯЗАН деградировать до «без общего кеша», а не подвешивать рендер:
// фреймворк НЕ оборачивает get() в try/catch, а рендер ждёт его результата. При
// недоступном Redis get() должен быстро вернуть undefined (промах), а не висеть.
// node-redis по умолчанию переподключается ВЕЧНО (reconnectStrategy отдаёт
// бэкофф на каждый сбой), из-за чего connect() и команды не завершаются. Поэтому:
//   • ограничиваем reconnectStrategy (после N попыток → Error, connect() падает);
//   • connectTimeout — быстрый отказ на этапе соединения;
//   • disableOfflineQueue — команды при неготовом соединении сразу reject, не копятся;
//   • дополнительно гоняем каждую операцию против короткого таймаута.

const { createClient } = require("redis");

const CONNECT_TIMEOUT_MS = 500;
const OP_TIMEOUT_MS = 800;
const MAX_RECONNECT = 2;

let clientPromise = null;

// Возвращает fallback, если промис не успел за ms — рендер не должен ждать Redis.
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => {
      const t = setTimeout(() => resolve(fallback), ms);
      if (typeof t.unref === "function") t.unref();
    }),
  ]);
}

// Ленивое подключение с быстрым отказом. При неудаче сбрасываем clientPromise,
// чтобы следующий запрос попробовал заново (Redis мог подняться).
function getClient() {
  if (!clientPromise) {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: CONNECT_TIMEOUT_MS,
        // После MAX_RECONNECT попыток возвращаем Error → connect() reject'ится,
        // и мы уходим в промах, а не в вечный цикл переподключения.
        reconnectStrategy: (retries) =>
          retries > MAX_RECONNECT
            ? new Error("redis unavailable")
            : Math.min((retries + 1) * 50, 200),
      },
      disableOfflineQueue: true, // команды при неготовом соединении → сразу reject
    });
    client.on("error", () => {
      /* глушим — иначе один разрыв соединения роняет процесс */
    });
    clientPromise = client.connect().then(
      () => client,
      () => {
        clientPromise = null; // дать шанс переподключиться на следующем запросе
        return null;
      },
    );
  }
  return clientPromise;
}

module.exports = {
  async get(cacheKey) {
    try {
      const client = await withTimeout(getClient(), CONNECT_TIMEOUT_MS + 200, null);
      if (!client) return undefined; // промах
      const stored = await withTimeout(client.get(cacheKey), OP_TIMEOUT_MS, null);
      if (!stored) return undefined; // промах (или таймаут операции)
      const d = JSON.parse(stored);
      return {
        value: new ReadableStream({
          start(c) {
            c.enqueue(Buffer.from(d.value, "base64"));
            c.close();
          },
        }),
        tags: d.tags,
        stale: d.stale,
        timestamp: d.timestamp,
        expire: d.expire,
        revalidate: d.revalidate,
      };
    } catch {
      return undefined; // любая ошибка = промах (иначе render error)
    }
  },

  async set(cacheKey, pendingEntry) {
    try {
      const entry = await pendingEntry;
      const reader = entry.value.getReader();
      const chunks = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const client = await withTimeout(getClient(), CONNECT_TIMEOUT_MS + 200, null);
      if (!client) return; // best-effort: нет Redis → просто не пишем
      const payload = JSON.stringify({
        value: Buffer.concat(chunks).toString("base64"),
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      });
      // TTL = expire (по интерфейсу это ДЛИТЕЛЬНОСТЬ в секундах), с полом в 1с;
      // иначе запись жила бы в Redis вечно.
      const ttlSec =
        typeof entry.expire === "number" && entry.expire > 0
          ? Math.max(1, Math.ceil(entry.expire))
          : undefined;
      const op = ttlSec
        ? client.set(cacheKey, payload, { EX: ttlSec })
        : client.set(cacheKey, payload);
      await withTimeout(op, OP_TIMEOUT_MS, null);
    } catch {
      /* best-effort: ошибка записи в кеш не должна ронять рендер */
    }
  },

  // Синхронизация инвалидаций тегов из общего стора перед запросом.
  // Полноценная кросс-подовая координация тегов — предмет прод-реализации
  // (хранить время инвалидации тега в Redis и сверять с timestamp записи).
  async refreshTags() {},

  async getExpiration() {
    return 0;
  },

  async updateTags() {},
};
