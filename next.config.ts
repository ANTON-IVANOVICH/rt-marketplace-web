import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // reactCompiler: true, // опционально: стабилен в 16, авто-мемоизация. Включим на этапе 8.
};

export default nextConfig;
