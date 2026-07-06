import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProduct,
  getProductStock,
  getProductsPage,
} from "@/lib/data/products";
import { formatPrice } from "@/lib/format";

export async function generateStaticParams() {
  // Cache Components требует ≥1 param, чтобы построить статический shell.
  const { items } = await getProductsPage({ limit: 20 });
  if (items.length === 0) {
    // Пустой каталог на билде: заглушка, чтобы валидация прошла;
    // страница обработает её через notFound().
    return [{ id: "__placeholder__" }];
  }
  return items.map((p) => ({ id: p.id }));
}

// dynamicParams по умолчанию true — товары, добавленные ПОСЛЕ билда, рендерятся
// on-demand при первом запросе и кешируются через 'use cache' (ISR-поведение).
// Для фиксированного каталога поставили бы `export const dynamicParams = false`.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Товар не найден" };

  return {
    title: product.title,
    description: product.description ?? `Купить «${product.title}»`,
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      type: "website",
    },
  };
}

// Динамическая дыра: свежий остаток. cacheLife('seconds') исключает её из
// статического shell — стримится в Suspense.
async function LiveStock({ id }: { id: string }) {
  const stock = await getProductStock(id);
  if (stock === null) return null;
  return (
    <p className="mt-4 text-sm">
      {stock > 0 ? (
        <span className="text-green-700">В наличии: {stock} шт.</span>
      ) : (
        <span className="text-red-600">Нет в наличии</span>
      )}
    </p>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "__placeholder__") notFound();
  const product = await getProduct(id); // кешировано (профиль product) → в shell
  if (!product) notFound();

  return (
    <article>
      {/* Всё ниже — кешированный статический shell, отдаётся мгновенно */}
      <nav className="text-sm text-zinc-500">
        <Link href="/products" className="hover:underline">
          Товары
        </Link>{" "}
        / {product.title}
      </nav>
      <h1 className="mt-2 text-3xl font-semibold">{product.title}</h1>
      <p className="mt-2 text-xl">
        {formatPrice(product.priceCents, product.currency)}
      </p>
      {product.description && (
        <p className="mt-4 text-zinc-600">{product.description}</p>
      )}

      {/* Динамическая дыра: свежий остаток стримится отдельно */}
      <Suspense
        fallback={
          <p className="mt-4 text-sm text-zinc-400">Проверяем наличие…</p>
        }
      >
        <LiveStock id={id} />
      </Suspense>
    </article>
  );
}
