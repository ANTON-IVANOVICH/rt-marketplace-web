import { z } from "zod";

// Серверные переменные — недоступны в браузере.
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_INTERNAL_URL: z.string().url(),
});

// Клиентские — только с префиксом NEXT_PUBLIC_, Next инлайнит их в бандл.
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // WS к Fastify — единственное место, где браузер идёт в Fastify напрямую (аукционы).
  NEXT_PUBLIC_WS_URL: z.string().min(1),
});

// Клиентские переменные надо перечислять явно — Next подменяет их статически,
// process.env[dynamicKey] на клиенте не работает.
const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
});

// Серверные парсим только на сервере.
function parseServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv accessed on the client");
  }
  return serverSchema.parse(process.env);
}

export const clientConfig = clientEnv;
export const serverEnv =
  typeof window === "undefined" ? parseServerEnv() : (null as never);
