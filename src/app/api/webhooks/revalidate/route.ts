import { NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "node:crypto";
import { serverEnv } from "@/lib/env";

export async function POST(request: Request) {
  const signature = request.headers.get("x-signature") ?? "";
  const raw = await request.text();

  // HMAC-проверка — вебхук публичен, аутентификация обязательна.
  const expected = crypto
    .createHmac("sha256", serverEnv.WEBHOOK_SECRET)
    .update(raw)
    .digest("hex");
  // Сверяем длину БАЙТОВ (Buffer), а не строк: многобайтовая x-signature дала бы
  // разную длину буферов и уронила timingSafeEqual (500 вместо 401).
  const sig = Buffer.from(signature);
  const exp = Buffer.from(expected);
  const valid = sig.length === exp.length && crypto.timingSafeEqual(sig, exp);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { type: string; productId?: string };

  // В Route Handler — revalidateTag (2 аргумента в Next 16), НЕ updateTag.
  if (event.type === "product.updated" && event.productId) {
    revalidateTag(`product-${event.productId}`, "max");
  } else if (event.type === "products.changed") {
    revalidateTag("products", "max");
  }

  // Необязательная тяжёлая работа — ПОСЛЕ ответа, не блокируя его.
  after(async () => {
    console.log(`[webhook] обработано ${event.type}`);
    // здесь: запись в аналитику, отправка уведомления, прогрев кеша
  });

  return NextResponse.json({ received: true });
}
