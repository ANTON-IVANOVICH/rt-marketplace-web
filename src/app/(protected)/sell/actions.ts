"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { apiAuthed } from "@/lib/api/authed-client";
import { unwrap, ApiError } from "@/lib/api/http";

const schema = z.object({
  title: z.string().min(1, "Укажите название").max(200),
  description: z.string().max(5000).optional(),
  priceCents: z.coerce.number().int().min(0, "Цена не может быть отрицательной"),
  stock: z.coerce.number().int().min(0).default(0),
});

export type CreateProductState =
  | {
      fieldErrors?: Record<string, string>;
      message?: string;
      values?: Record<string, string>;
    }
  | undefined;

export async function createProductAction(
  _prev: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  // 1. Проверка сессии — обязательна, action это публичный эндпоинт.
  const user = await getCurrentUser();
  if (!user) return { message: "Войдите, чтобы создать товар." };

  // 2. Валидация. z.coerce превращает строки формы в числа.
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priceCents: formData.get("priceCents"),
    stock: formData.get("stock"),
  });

  if (!parsed.success) {
    // По одной ошибке на поле — версионно-нейтрально к API zod.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      fieldErrors,
      values: {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        priceCents: String(formData.get("priceCents") ?? ""),
        stock: String(formData.get("stock") ?? ""),
      },
    };
  }

  // 3. Мутация в Fastify. owner ставит сам Fastify из JWT — Next его не шлёт.
  let created;
  try {
    created = await unwrap(
      apiAuthed.POST("/api/v1/products/", { body: parsed.data }),
    );
  } catch (err) {
    return {
      message:
        err instanceof ApiError ? err.message : "Не удалось создать товар.",
    };
  }

  // 4. Инвалидация: список товаров обновится у всех (фоновый SWR).
  revalidateTag("products", "max");

  // 5. redirect — ВНЕ try/catch (бросает control-flow сигнал).
  redirect(`/products/${created.id}`);
}
