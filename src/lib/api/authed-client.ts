import "server-only";
import { cookies } from "next/headers";
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import { serverEnv } from "../env";
import { COOKIE_ACCESS } from "../auth/cookies";

// Читает access-токен из cookie и форвардит его как Authorization: Bearer.
// НЕЛЬЗЯ внутри 'use cache' (читает cookies()). Только в динамических
// компонентах (в Suspense) и в Server Actions / Route Handlers.
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = (await cookies()).get(COOKIE_ACCESS)?.value;
    if (token) request.headers.set("authorization", `Bearer ${token}`);
    return request;
  },
};

export const apiAuthed = createClient<paths>({
  baseUrl: serverEnv.API_INTERNAL_URL,
});
apiAuthed.use(authMiddleware);
