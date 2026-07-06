import Link from "next/link";
import type { Route } from "next";
import { listProducts } from "@/lib/data/products";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ filters?: string[] }>;
}) {
  const { filters = [] } = await params;
  const { items } = await listProducts({ limit: 20 });

  return (
    <div>
      <nav className="text-sm text-zinc-500">
        <Link href={"/catalog" as Route} className="hover:underline">
          Каталог
        </Link>
        {filters.map((seg, i) => (
          <span key={i}> / {decodeURIComponent(seg)}</span>
        ))}
      </nav>
      <h1 className="mt-2 text-2xl font-semibold">
        {filters.length
          ? filters.map(decodeURIComponent).join(" → ")
          : "Все категории"}
      </h1>

      {/* Fastify не поддерживает фильтрацию по категориям, и менять его нельзя —
          поэтому показываем общий список. Это демонстрация роутинга, не фильтрации. */}
      <ul className="mt-6 space-y-2">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`} className="hover:underline">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
