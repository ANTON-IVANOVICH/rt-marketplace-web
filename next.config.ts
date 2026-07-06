import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Docker/прод-сборку помечаем флагом DOCKER_BUILD (ставит Dockerfile). Он решает
// сразу два вопроса во время СБОРКИ (важно: с output:'standalone' next.config
// вычисляется на билде и замораживается — рантайм-переменные его уже не меняют):
//   • output:'standalone' — самодостаточный server.js;
//   • cacheHandlers → Redis — чтобы хендлер попал в конфиг И его зависимость
//     `redis` затрейсилась в standalone. Гейтить это по REDIS_URL нельзя: в
//     compose переменная появляется только в рантайме, когда конфиг уже застыл.
// Локально флага нет → обычный `next start`, кеш in-memory, Redis не нужен.
const dockerBuild = process.env.DOCKER_BUILD === "true";
const redisHandler = fileURLToPath(
  new URL("./cache-handlers/redis-handler.cjs", import.meta.url),
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true, // компилятор проверяет href в <Link> и router.push против реальных маршрутов
  ...(dockerBuild ? { output: "standalone" as const } : {}),
  reactCompiler: true, // стабилен в Next 16: авто-мемоизация, нарушителей Rules of React пропускает с предупреждением
  cacheLife: {
    // Список товаров: меняется при добавлении товара, освежаем часто.
    productList: { stale: 60, revalidate: 120, expire: 600 },
    // Карточка товара: относительно стабильна.
    product: { stale: 300, revalidate: 900, expire: 3600 },
  },
  images: {
    qualities: [75], // ОБЯЗАТЕЛЬНО в Next 16; quality вне списка приводится к ближайшему
    minimumCacheTTL: 60 * 60 * 4, // 4 часа
    // images.domains DEPRECATED → только remotePatterns.
    remotePatterns: [
      // dev: локальный storage Fastify отдаёт /static/products/<id>/<img>.webp
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/static/**",
      },
      // прод: реальный CDN/S3, флаг dangerouslyAllowLocalIP не нужен
      // { protocol: "https", hostname: "cdn.example.com", pathname: "/products/**" },
    ],
    // Next 16 по умолчанию блокирует локальные адреса — для картинок с localhost:3000 в dev.
    dangerouslyAllowLocalIP: true,
  },
  experimental: {
    // 15 МБ картинки для Fastify + overhead multipart-границ. Лимит бьёт по
    // сырому телу, поэтому берём с запасом.
    serverActions: { bodySizeLimit: "16mb" },
  },
  // Общий кеш для мульти-инстансного self-host: и default, и remote → Redis,
  // чтобы revalidateTag распространялся между репликами (долг слоя кеширования).
  // Адрес Redis хендлер читает из process.env.REDIS_URL в рантайме (из compose).
  ...(dockerBuild
    ? { cacheHandlers: { default: redisHandler, remote: redisHandler } }
    : {}),
};

// ANALYZE=true npm run build открывает treemap клиентского бандла.
const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default analyze(nextConfig);
