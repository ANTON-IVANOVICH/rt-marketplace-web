import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { apiAuthed } from "../api/authed-client";
import { unwrap } from "../api/http";
import { COOKIE_ACCESS } from "./cookies";

// React cache() — дедуп в пределах ОДНОГО запроса (не персистентно между
// запросами). getCurrentUser читает cookie (рантайм-данные), поэтому 'use cache'
// ей нельзя — только React cache(). Ровно тот случай, под который cache() и есть.
//
// Примечание: спека предлагала ещё experimental_taintObjectReference на user, но
// taint-API есть только в react@experimental — в стабильном React 19.2 функция
// не экспортируется (упадёт в рантайме). Настоящую защиту токена даёт httpOnly-
// cookie (JS его не видит) + server-only-модули; taint был лишь страховкой.
// Дисциплина «в Client Component передаём только нужные поля user, не объект
// целиком» остаётся — просто соблюдается вручную.
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE_ACCESS)?.value;
  if (!token) return null;
  try {
    return await unwrap(apiAuthed.GET("/api/v1/users/me/"));
  } catch {
    return null; // 401 и т.п. → не аутентифицирован
  }
});
