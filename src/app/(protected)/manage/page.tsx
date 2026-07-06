import { getProductsPage } from "@/lib/data/products";
import { ManageProducts } from "./manage-products";

export default async function ManagePage() {
  const { items } = await getProductsPage({ limit: 50 });
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Управление товарами</h1>
      <ManageProducts
        initial={items.map((p) => ({ id: p.id, title: p.title }))}
      />
    </main>
  );
}
