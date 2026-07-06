import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";

export const alt = "Товар";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Cache Components требует ≥1 sample для валидации доступа к params при сборке.
export function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // params — Promise в Next 16
  const product = id === "__placeholder__" ? null : await getProduct(id);
  const title = product?.title ?? "Товар не найден";
  const price = product ? formatPrice(product.priceCents, product.currency) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 28, color: "#71717a" }}>Marketplace</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#18181b",
            marginTop: 20,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 48, color: "#16a34a", marginTop: 24 }}>
          {price}
        </div>
      </div>
    ),
    { ...size },
  );
}
