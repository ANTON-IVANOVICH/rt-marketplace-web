import { test, expect } from "@playwright/test";

// Сквозной путь через весь стек: логин → создание товара → редирект на карточку.
// Требует живого Fastify и учётки; в CI — отдельной job с поднятым стеком.
const EMAIL = process.env.E2E_EMAIL ?? "seed+web@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "Passw0rd!23";

test("создание товара", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // Ждём редирект логина на /account: только после него Set-Cookie применён.
  // Иначе goto('/sell') оборвёт in-flight server action и сессия не сохранится.
  await page.waitForURL("**/account");

  await page.goto("/sell");
  const title = `E2E товар ${Date.now()}`;
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="priceCents"]', "100000");
  await page.fill('input[name="stock"]', "3");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
