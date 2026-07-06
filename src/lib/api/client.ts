import "server-only";
import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { serverEnv } from "../env";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = createClient<paths>({
  baseUrl: serverEnv.API_INTERNAL_URL,
});

// Точка расширения под аутентификацию (этап 4). Bearer-форвардинг из cookie
// добавим здесь вместе с разделением на публичный/авторизованный клиенты.
//
// ВАЖНО, почему middleware НЕ регистрируется сейчас: при наличии хотя бы одного
// middleware openapi-fetch генерирует id запроса через Math.random() на каждый
// вызов. Cache Components запрещает недетерминированные API (Math.random/Date)
// и в prerender, и внутри 'use cache' — а публичные чтения товаров у нас как раз
// кешируются через 'use cache'. Поэтому публичный клиент остаётся без middleware;
// авторизованный (с чтением cookie) появится на этапе 4 отдельным клиентом.
//
// import type { Middleware } from "openapi-fetch";
// const authMiddleware: Middleware = {
//   async onRequest({ request }) {
//     const token = (await cookies()).get("access_token")?.value;
//     if (token) request.headers.set("authorization", `Bearer ${token}`);
//     return request;
//   },
// };
// api.use(authMiddleware);

/**
 * Разворачивает результат openapi-fetch ({ data, error, response }):
 * бросает типизированный ApiError при не-2xx, иначе возвращает data.
 * Формат ошибки соответствует error-схеме Fastify: { statusCode, error, message, code, details }.
 */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await call;
  if (error || !response.ok) {
    const body = (error ?? {}) as {
      message?: string;
      code?: string;
      details?: unknown;
    };
    throw new ApiError(
      response.status,
      body.message ?? response.statusText,
      body.code,
      body.details,
    );
  }
  return data as T;
}
