import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true, // компилятор проверяет href в <Link> и router.push против реальных маршрутов
  // reactCompiler: true, // опционально: стабилен в 16, авто-мемоизация. Включим на этапе 8.
};

export default nextConfig;
