import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";
import { COOKIE_ACCESS } from "@/lib/auth/cookies";

// CORS должен стоять и на префлайте (OPTIONS), и на самом ответе GET — иначе
// браузер пройдёт preflight, но заблокирует чтение ответа.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization",
};

// BFF-агрегация: собираем товар + ставки в один ответ под внешнего потребителя
// (например, мобильное приложение), форвардя auth в Fastify.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = (await cookies()).get(COOKIE_ACCESS)?.value;
  const auth = token ? { authorization: `Bearer ${token}` } : undefined;
  const base = serverEnv.API_INTERNAL_URL;

  const [productRes, bidsRes] = await Promise.all([
    fetch(`${base}/api/v1/products/${id}/`),
    fetch(`${base}/api/v1/auctions/${id}/bids`, { headers: auth }),
  ]);

  // Любой не-2xx от товара форвардим как есть (404, 400 на кривой uuid, 5xx),
  // а не маскируем под 200 с телом ошибки в поле product.
  if (!productRes.ok) {
    return NextResponse.json(
      { error: productRes.status === 404 ? "Not found" : "Upstream error" },
      { status: productRes.status, headers: CORS },
    );
  }

  return NextResponse.json(
    {
      product: await productRes.json(),
      bids: bidsRes.ok ? await bidsRes.json() : [],
    },
    { headers: CORS },
  );
}

// CORS-префлайт для кросс-доменных потребителей.
export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}
