import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError, unwrap } from "@/lib/api/client";
import type { Product, ProductList } from "@/lib/api/types";

export async function getProduct(id: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours"); // профиль по умолчанию; тонкая настройка — этап 3
  cacheTag(`product-${id}`); // для точечной инвалидации после мутаций — этап 5

  const { data, error, response } = await api.GET("/api/v1/products/{id}/", {
    params: { path: { id } },
  });
  // Реальный Fastify: несуществующий, но валидный UUID → 404; невалидный формат
  // id → 400 (FST_ERR_VALIDATION по формату uuid). И то и другое означает «такого
  // товара нет» → возвращаем null, чтобы страница показала not-found.tsx.
  if (response.status === 404 || response.status === 400) return null;
  if (error || !data) {
    throw new ApiError(
      response.status,
      (error as { message?: string })?.message ?? "Failed to load",
    );
  }
  return data;
}

// Список зависит от cursor/limit из URL → запрос-специфичен, НЕ кешируем.
export async function listProducts(query: {
  limit?: number;
  cursor?: string;
}): Promise<ProductList> {
  // Схема Fastify требует limit (number) — даём разумный дефолт, если не задан.
  // unwrap нормализует ошибки в ApiError; у этого эндпоинта в схеме только 200,
  // поэтому ветку error openapi-fetch схлопывает — ручной разбор тут не набрать.
  return unwrap(
    api.GET("/api/v1/products/", {
      params: { query: { limit: query.limit ?? 20, cursor: query.cursor } },
    }),
  );
}
