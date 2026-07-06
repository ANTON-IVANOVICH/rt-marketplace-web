import { revalidateTag, updateTag } from "next/cache";

export const tags = {
  allProducts: "products",
  product: (id: string) => `product-${id}`,
  productStock: (id: string) => `product-${id}-stock`,
} as const;

// Фоновая инвалидация (SWR): пользователи продолжают видеть кеш, Next обновляет
// в фоне. В Next 16 revalidateTag требует профиль cacheLife вторым аргументом;
// max рекомендуется для большинства случаев. Для общих списков после изменений.
export function revalidateProducts() {
  revalidateTag(tags.allProducts, "max");
}

// Немедленная инвалидация (read-your-writes): только из Server Action (этап 5),
// где пользователь должен сразу увидеть результат своей мутации.
export function refreshProductNow(id: string) {
  updateTag(tags.product(id));
}
