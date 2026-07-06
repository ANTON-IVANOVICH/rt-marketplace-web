import { notFound } from "next/navigation";
import { getProduct } from "@/lib/data/products";
import { AuctionPanelLoader } from "./auction-panel-loader";
import { LiveTicker } from "./live-ticker";

export async function generateStaticParams() {
  return [{ id: "__placeholder__" }]; // Cache Components требует ≥1 sample
}

export default async function AuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "__placeholder__") notFound();
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{product.title}</h1>
      {product.description && (
        <p className="mt-2 text-zinc-600">{product.description}</p>
      )}
      <div className="mt-6">
        <AuctionPanelLoader productId={id} currency={product.currency} />
      </div>
      <LiveTicker />
    </main>
  );
}
