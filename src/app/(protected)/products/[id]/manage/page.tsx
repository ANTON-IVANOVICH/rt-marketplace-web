import Link from "next/link";
import { ImageUploadForm } from "./image-upload-form";

export default async function ProductImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Изображения товара</h1>
      <Link
        href={`/products/${id}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← К товару
      </Link>
      <div className="mt-6">
        <ImageUploadForm productId={id} />
      </div>
    </main>
  );
}
