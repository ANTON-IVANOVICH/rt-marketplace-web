import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";

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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <article>
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
      <p className="mt-4 text-sm text-zinc-500">В наличии: {product.stock} шт.</p>
    </article>
  );
}
