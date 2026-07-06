import { cacheLife, cacheTag } from "next/cache";
import { apiPublic } from "@/lib/api/public-client";
import { ApiError, unwrap } from "@/lib/api/http";
import type { Product, ProductList } from "@/lib/api/types";

// === Function-level: одиночный товар ===
export async function getProduct(id: string): Promise<Product | null> {
  "use cache";
  cacheLife("product"); // кастомный профиль из next.config
  cacheTag("products", `product-${id}`); // широкий + точечный тег

  const { data, error, response } = await apiPublic.GET("/api/v1/products/{id}/", {
    params: { path: { id } },
  });
  // 404 (нет товара) и 400 (кривой uuid) → null: страница уйдёт в notFound().
  if (response.status === 404 || response.status === 400) return null;
  if (error || !data) {
    throw new ApiError(
      response.status,
      (error as { message?: string })?.message ?? "Failed",
    );
  }
  return data;
}

// === Function-level: страница списка ===
// Курсор и limit — это АРГУМЕНТЫ, они становятся частью ключа кеша.
// Каждая (limit, cursor)-комбинация кешируется отдельно.
export async function getProductsPage(query: {
  limit: number;
  cursor?: string;
}): Promise<ProductList> {
  "use cache";
  cacheLife("productList");
  cacheTag("products");

  // list-эндпоинт объявляет только 200 → openapi-fetch схлопывает ветку error,
  // а response типизируется как never; unwrap разбирает ошибки за нас.
  return unwrap(apiPublic.GET("/api/v1/products/", { params: { query } }));
}

// === Картинки товара ===
// Fastify отдаёт абсолютные URL на свой storage (/static/products/<id>/…webp).
// Кешируем под тем же тегом product-<id>, что и сам товар.
export type ProductImage = {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  position: number;
};

export async function getProductImages(id: string): Promise<ProductImage[]> {
  "use cache";
  cacheLife("product");
  cacheTag("products", `product-${id}`);

  const { data } = await apiPublic.GET("/api/v1/products/{id}/images", {
    params: { path: { id } },
  });
  return data ?? [];
}

// === Живой остаток — намеренно короткий профиль (динамическая дыра) ===
// Fastify отдаёт stock внутри товара; в проде выставили бы лёгкий /stock-эндпоинт.
// Здесь переиспользуем тот же запрос, чтобы показать паттерн: остаток волатилен
// (падает при заказах), поэтому профиль seconds для него оправдан.
export async function getProductStock(id: string): Promise<number | null> {
  "use cache";
  cacheLife("seconds"); // → динамическая дыра, ОБЯЗАН быть в <Suspense>
  cacheTag(`product-${id}-stock`);

  const { data } = await apiPublic.GET("/api/v1/products/{id}/", {
    params: { path: { id } },
  });
  return data?.stock ?? null;
}
