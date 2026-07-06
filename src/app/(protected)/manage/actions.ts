"use server";

import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { apiAuthed } from "@/lib/api/authed-client";

export async function deleteProductAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { error, response } = await apiAuthed.DELETE("/api/v1/products/{id}/", {
    params: { path: { id } },
  });
  if (error || !response.ok) {
    if (response.status === 403) throw new Error("Это не ваш товар");
    if (response.status === 404) throw new Error("Товар уже удалён");
    throw new Error("Не удалось удалить товар"); // throw → автоматический откат useOptimistic
  }
  revalidateTag("products", "max"); // обновит закешированный список
}
