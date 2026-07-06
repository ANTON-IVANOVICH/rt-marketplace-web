import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProduct,
  getProductImages,
  getProductStock,
  getProductsPage,
} from "@/lib/data/products";
import { formatPrice } from "@/lib/format";

export async function generateStaticParams() {
  // Cache Components требует ≥1 param, чтобы построить статический shell.
  // Fastify может быть недоступен на сборке (герметичный docker build без API) —
  // тогда отдаём заглушку: реальные товары отрендерятся on-demand в рантайме
  // (dynamicParams по умолчанию true). Сама заглушка уходит в notFound().
  try {
    const { items } = await getProductsPage({ limit: 20 });
    if (items.length === 0) return [{ id: "__placeholder__" }];
    return items.map((p) => ({ id: p.id }));
  } catch {
    return [{ id: "__placeholder__" }];
  }
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
  // Заглушка не должна дёргать API (иначе герметичная сборка без Fastify падает
  // на prerender метаданных); сама страница отдаёт для неё notFound().
  if (id === "__placeholder__") return { title: "Товар" };
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
  const [product, images] = await Promise.all([
    getProduct(id), // кешировано (профиль product) → в shell
    getProductImages(id),
  ]);
  if (!product) notFound();
  const cover = images[0];

  return (
    <article>
      {/* Всё ниже — кешированный статический shell, отдаётся мгновенно */}
      <nav className="text-sm text-zinc-500">
        <Link href="/products" className="hover:underline">
          Товары
        </Link>{" "}
        / {product.title}
      </nav>
      {cover && (
        // Картинку грузит браузер напрямую из storage Fastify, оптимизатор Next
        // её прогоняет (remotePatterns → localhost:3000/static/**). preload —
        // проп приоритета в Next 16 (бывший priority): грузим обложку сразу.
        <Image
          src={cover.url}
          alt={product.title}
          width={cover.width}
          height={cover.height}
          quality={75}
          preload
          sizes="(max-width: 640px) 100vw, 400px"
          className="mt-4 h-auto w-full max-w-md rounded-lg border border-zinc-200 object-cover"
        />
      )}
      <h1 className="mt-4 text-3xl font-semibold">{product.title}</h1>
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
