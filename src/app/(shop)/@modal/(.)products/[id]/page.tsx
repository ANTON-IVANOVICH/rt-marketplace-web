import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import { Modal } from "./modal";

export async function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

export default async function ProductModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "__placeholder__") notFound();
  const product = await getProduct(id); // тот же кешированный getProduct
  if (!product) notFound();

  return (
    <Modal>
      <h2 className="text-xl font-semibold">{product.title}</h2>
      <p className="mt-2 text-lg">
        {formatPrice(product.priceCents, product.currency)}
      </p>
      {product.description && (
        <p className="mt-3 text-zinc-600">{product.description}</p>
      )}
      {/* Обычный <a> (hard-навигация) → полная страница, без повторного перехвата. */}
      <a
        href={`/products/${id}`}
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        Открыть полностью →
      </a>
    </Modal>
  );
}
