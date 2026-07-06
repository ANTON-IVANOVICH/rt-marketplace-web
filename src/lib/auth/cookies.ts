export const COOKIE_ACCESS = "mp_access";
export const COOKIE_REFRESH = "mp_refresh";

// httpOnly — токен недоступен JS в браузере (защита от кражи через XSS).
// sameSite: 'lax' — базовая защита от CSRF.
export const accessCookieOptions = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 15, // совпадает с TTL access-токена Fastify (15 минут)
});

export const refreshCookieOptions = (isProd: boolean) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 дней
});
