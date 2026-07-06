import { NextResponse } from "next/server";
import { getProductsPage } from "@/lib/data/products"; // 'use cache'-хелпер

// GET читает searchParams (request.url) → handler динамический. Но данные берутся
// из getProductsPage с 'use cache' — динамический handler ≠ некешированные данные.
// (use cache нельзя ставить прямо в теле handler — только в хелпере.)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 20, 1),
    100,
  );
  const cursor = searchParams.get("cursor") ?? undefined;

  const data = await getProductsPage({ limit, cursor });
  return NextResponse.json(data);
}
