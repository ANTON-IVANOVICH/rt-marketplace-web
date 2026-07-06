import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import { serverEnv } from "@/lib/env";

const PROTECTED = ["/account", "/sell"];

// Оптимистичная проверка истечения — БЕЗ верификации подписи (её делает Fastify).
// proxy.ts на Node.js-рантайме → декодируем payload нативным Buffer, без edge-лимитов.
function isExpired(jwt: string): boolean {
  try {
    const [, payload] = jwt.split(".");
    const { exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return typeof exp !== "number" || Date.now() >= (exp - 60) * 1000; // запас 60с
  } catch {
    return true;
  }
}

async function tryRefresh(refreshToken: string) {
  try {
    const res = await fetch(
      `${serverEnv.API_INTERNAL_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as { accessToken: string; refreshToken: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const access = request.cookies.get(COOKIE_ACCESS)?.value;
  const refresh = request.cookies.get(COOKIE_REFRESH)?.value;

  // Проактивный refresh на любом маршруте: access истёк/отсутствует, но есть refresh.
  // Срабатывает раз в ~15 минут на пользователя, не на каждый запрос.
  if (refresh && (!access || isExpired(access))) {
    const tokens = await tryRefresh(refresh);
    if (tokens) {
      const isProd = serverEnv.NODE_ENV === "production";
      // Прокидываем новый access и в ЗАПРОС, чтобы рендер этого же запроса уже
      // видел свежий токен (иначе защищённый layout словил бы 401 и увёл на /login).
      request.cookies.set(COOKIE_ACCESS, tokens.accessToken);
      const response = NextResponse.next({ request });
      response.cookies.set(
        COOKIE_ACCESS,
        tokens.accessToken,
        accessCookieOptions(isProd),
      );
      response.cookies.set(
        COOKIE_REFRESH,
        tokens.refreshToken,
        refreshCookieOptions(isProd),
      );
      return response;
    }
    // refresh мёртв (протух/отозван ротацией) → чистим и, если надо, на логин.
    const response = isProtected
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();
    response.cookies.delete(COOKIE_ACCESS);
    response.cookies.delete(COOKIE_REFRESH);
    return response;
  }

  // Защищённый маршрут без refresh-сессии → оптимистичный редирект.
  if (isProtected && !refresh) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Исключаем статику, иначе proxy гоняется на каждый ассет.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
