import Link from "next/link";
import { getProductsPage } from "@/lib/data/products";
import { ProductCard } from "./_components/product-card";
import { PageSizeSelect } from "./_components/page-size-select";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; limit?: string }>;
}) {
  const { cursor, limit } = await searchParams;
  const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const { items, nextCursor } = await getProductsPage({
    limit: parsedLimit,
    cursor,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товары</h1>
        <PageSizeSelect />
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-zinc-500">Ничего не найдено.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {nextCursor && (
        <div className="mt-8">
          <Link
            href={`/products?limit=${parsedLimit}&cursor=${encodeURIComponent(nextCursor)}`}
            className="inline-block rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Следующая страница →
          </Link>
        </div>
      )}
    </div>
  );
}
