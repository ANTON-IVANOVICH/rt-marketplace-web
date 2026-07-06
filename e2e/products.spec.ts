import { test, expect } from "@playwright/test";

// Смоук: витрина открывается и рендерит список товаров (данные из Fastify).
test("список товаров открывается", async ({ page }) => {
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Товары", level: 1 }),
  ).toBeVisible();
});

// Смоук: карточка товара ведёт на страницу товара.
test("переход в карточку товара", async ({ page }) => {
  await page.goto("/products");
  const firstCard = page.locator('a[href^="/products/"]').first();
  await firstCard.click();
  await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}/);
});
