import type { Route } from "next";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== serverEnv.DRAFT_SECRET) {
    return new Response("Invalid token", { status: 401 });
  }
  // Только внутренние пути — иначе open redirect. Первый символ '/', второй — НЕ
  // '/' и НЕ '\' (браузер нормализует '\' в '/', так что '/\evil.com' обходит
  // проверку только на '//').
  const target = searchParams.get("redirect") ?? "/products";
  const safe = /^\/[^/\\]/.test(target) ? target : "/products";

  (await draftMode()).enable(); // draftMode асинхронный в Next 16
  redirect(safe as Route);
}
