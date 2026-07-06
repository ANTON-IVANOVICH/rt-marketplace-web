import { defineConfig, devices } from "@playwright/test";

// E2E через весь стек: Next (:3001) + живой Fastify (:3000). Серверы поднимаются
// снаружи (docker-compose или два процесса) — конфиг их не стартует, чтобы E2E
// шёл против реального Fastify. Базовый URL берём из env с дефолтом на :3001.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
