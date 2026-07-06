import Link from "next/link";
import type { Product } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 hover:shadow-sm"
    >
      <h3 className="font-medium">{product.title}</h3>
      <p className="mt-1 text-sm text-zinc-600">
        {formatPrice(product.priceCents, product.currency)}
      </p>
      {product.stock === 0 && (
        <span className="mt-2 inline-block text-xs text-red-600">
          Нет в наличии
        </span>
      )}
    </Link>
  );
}
