"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiPublic } from "@/lib/api/public-client";
import { apiAuthed } from "@/lib/api/authed-client";
import { unwrap, ApiError } from "@/lib/api/http";
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import { serverEnv } from "@/lib/env";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthState = { error?: string } | undefined;

async function setSessionCookies(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  const jar = await cookies(); // .set() допустим ТОЛЬКО в actions/route handlers
  const isProd = serverEnv.NODE_ENV === "production";
  jar.set(COOKIE_ACCESS, tokens.accessToken, accessCookieOptions(isProd));
  jar.set(COOKIE_REFRESH, tokens.refreshToken, refreshCookieOptions(isProd));
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return { error: "Проверьте email и пароль (минимум 8 символов)." };

  try {
    const { tokens } = await unwrap(
      apiPublic.POST("/api/v1/auth/login", { body: parsed.data }),
    );
    await setSessionCookies(tokens);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401)
      return { error: "Неверный email или пароль." };
    return { error: "Не удалось войти. Попробуйте позже." };
  }
  redirect("/account"); // ВНЕ try/catch: redirect работает через control-flow throw
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return { error: "Email некорректен или пароль короче 8 символов." };

  try {
    await unwrap(apiPublic.POST("/api/v1/auth/register", { body: parsed.data }));
    // Fastify register не возвращает токены → логинимся, чтобы поставить сессию.
    const { tokens } = await unwrap(
      apiPublic.POST("/api/v1/auth/login", { body: parsed.data }),
    );
    await setSessionCookies(tokens);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 409)
      return { error: "Email уже зарегистрирован." };
    return { error: "Не удалось зарегистрироваться." };
  }
  redirect("/account");
}

export async function logout() {
  const jar = await cookies();
  const refreshToken = jar.get(COOKIE_REFRESH)?.value;
  try {
    // Bearer (access) идёт через apiAuthed; refreshToken в теле — чтобы Fastify
    // отозвал именно эту сессию.
    await apiAuthed.POST("/api/v1/auth/logout", { body: { refreshToken } });
  } catch {
    /* игнорируем — всё равно чистим локально */
  }
  jar.delete(COOKIE_ACCESS);
  jar.delete(COOKIE_REFRESH);
  redirect("/login");
}
