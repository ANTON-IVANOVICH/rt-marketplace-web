import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Юнит-тесты чистых функций (слой данных мапперы, format, схемы, логика actions).
// Server Components напрямую не тестируем — сквозное поведение покрывает Playwright.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
