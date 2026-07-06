"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env";
import { COOKIE_ACCESS } from "@/lib/auth/cookies";

export type UploadState = { error?: string; success?: boolean } | undefined;

export async function uploadProductImageAction(
  productId: string,
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Войдите, чтобы загрузить изображение." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Файл не выбран." };
  if (file.size > 15 * 1024 * 1024) return { error: "Файл больше 15 МБ." };

  // Форвардим multipart в Fastify сырым fetch — openapi-fetch неудобен для multipart,
  // да и endpoint в схеме без типизированного тела (requestBody: never).
  const token = (await cookies()).get(COOKIE_ACCESS)?.value;
  const upstream = new FormData();
  upstream.append("file", file, file.name);

  const res = await fetch(
    `${serverEnv.API_INTERNAL_URL}/api/v1/products/${productId}/images`,
    {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body: upstream, // НЕ ставим Content-Type вручную — fetch сам задаст boundary
    },
  );

  if (!res.ok) {
    if (res.status === 403) return { error: "Это не ваш товар." };
    if (res.status === 413) return { error: "Файл слишком большой." };
    if (res.status === 415)
      return { error: "Поддерживаются только JPEG, PNG, WebP." };
    return { error: "Не удалось загрузить изображение." };
  }
  revalidateTag(`product-${productId}`, "max"); // точечная инвалидация карточки
  return { success: true };
}
