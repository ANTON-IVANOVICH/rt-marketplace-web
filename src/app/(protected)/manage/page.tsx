import { Suspense } from "react";
import { connection } from "next/server";
import { getProductsPage } from "@/lib/data/products";
import { ManageProducts } from "./manage-products";

// Список — динамическая дыра: `await connection()` не резолвится на сборке
// (prerender), поэтому фетч к Fastify НЕ выполняется на билде — образ собирается
// герметично (docker build / CI без живого API). В рантайме connection()
// резолвится сразу, список грузится и кешируется; ошибки API всплывают штатно.
async function ManageList() {
  await connection();
  const { items } = await getProductsPage({ limit: 50 });
  return (
    <ManageProducts initial={items.map((p) => ({ id: p.id, title: p.title }))} />
  );
}

export default function ManagePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Управление товарами</h1>
      <Suspense fallback={<p className="text-zinc-500">Загрузка…</p>}>
        <ManageList />
      </Suspense>
    </main>
  );
}
