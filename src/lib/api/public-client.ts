import "server-only";
import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { serverEnv } from "../env";

// Не читает cookie → БЕЗОПАСЕН внутри 'use cache'. Для публичных эндпоинтов
// (товары, login/register/refresh — им Bearer не нужен). Middleware не
// регистрируем: иначе openapi-fetch дёргал бы Math.random() для id запроса,
// что запрещено в prerender и внутри 'use cache'.
export const apiPublic = createClient<paths>({
  baseUrl: serverEnv.API_INTERNAL_URL,
});
