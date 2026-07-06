import { CreateProductForm } from "./create-product-form";

export default function SellPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Новый товар</h1>
      <CreateProductForm />
    </main>
  );
}
