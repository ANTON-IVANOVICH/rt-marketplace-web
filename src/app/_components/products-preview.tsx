import { api, unwrap, ApiError } from "@/lib/api/client";

export async function ProductsPreview() {
  let titles: string[] = [];

  try {
    const data = await unwrap(
      api.GET("/api/v1/products/", { params: { query: { limit: 5 } } }),
    );
    titles = data.items.map((p) => p.title);
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "неизвестная ошибка";
    return (
      <p className="text-sm text-red-600">
        Не удалось связаться с API ({message}). Запущен ли Fastify на :3000?
      </p>
    );
  }

  if (titles.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Товаров пока нет — создадим на этапе 5.
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-1">
      {titles.map((title) => (
        <li key={title} className="rounded bg-zinc-100 px-3 py-1.5 text-sm">
          {title}
        </li>
      ))}
    </ul>
  );
}
