import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-xl font-semibold">Товар не найден</h2>
      <p className="mt-1 text-zinc-600">Возможно, он был удалён.</p>
      <Link
        href="/products"
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        Ко всем товарам
      </Link>
    </div>
  );
}
