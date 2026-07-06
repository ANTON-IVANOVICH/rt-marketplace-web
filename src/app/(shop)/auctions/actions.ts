"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { COOKIE_ACCESS } from "@/lib/auth/cookies";

// Возвращает access-токен для WS-handshake (Fastify ждёт JWT в query, а браузер
// не читает httpOnly-cookie). Единственное место, где токен попадает в JS клиента:
// короткоживущий (15 мин), только для handshake; при обрыве берём свежий и
// переподключаемся. Идеал — отдельный эндпоинт WS-тикетов на Fastify, но это было
// бы изменением сервера.
export async function getAuctionTicket(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return (await cookies()).get(COOKIE_ACCESS)?.value ?? null;
}
