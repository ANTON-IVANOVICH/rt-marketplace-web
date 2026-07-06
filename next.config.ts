import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true, // компилятор проверяет href в <Link> и router.push против реальных маршрутов
  cacheLife: {
    // Список товаров: меняется при добавлении товара, освежаем часто.
    productList: { stale: 60, revalidate: 120, expire: 600 },
    // Карточка товара: относительно стабильна.
    product: { stale: 300, revalidate: 900, expire: 3600 },
  },
  experimental: {
    // 15 МБ картинки для Fastify + overhead multipart-границ. Лимит бьёт по
    // сырому телу, поэтому берём с запасом.
    serverActions: { bodySizeLimit: "16mb" },
  },
  // reactCompiler: true, // опционально: стабилен в 16, авто-мемоизация. Включим на этапе 8.
};

export default nextConfig;
