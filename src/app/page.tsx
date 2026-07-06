import { Suspense } from "react";
import { ProductsPreview } from "./_components/products-preview";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
      <p className="mt-2 text-zinc-600">
        Next.js 16 фронтенд поверх Fastify API.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Последние товары</h2>
        <Suspense
          fallback={<p className="mt-2 text-sm text-zinc-400">Загружаем…</p>}
        >
          <ProductsPreview />
        </Suspense>
      </section>
    </main>
  );
}
