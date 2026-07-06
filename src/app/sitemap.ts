import type { MetadataRoute } from "next";
import { getProductsPage } from "@/lib/data/products";
import { clientConfig } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientConfig.NEXT_PUBLIC_APP_URL;

  // Идём по nextCursor с разумным потолком страниц. Для очень крупных каталогов —
  // generateSitemaps (Next 16 отдаёт id как Promise), см. story.
  const products: { id: string; updatedAt: string }[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const { items, nextCursor } = await getProductsPage({ limit: 100, cursor });
    products.push(...items.map((p) => ({ id: p.id, updatedAt: p.updatedAt })));
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    ...products.map((p) => ({
      url: `${base}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
