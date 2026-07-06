import Form from "next/form";

// next/form раскрывается на НАВИГАЦИОННЫХ формах: action="/products" (строка) даёт
// GET-навигацию на /products?q=… с префетчем и клиентским переходом. Server
// Component, 'use client' не нужен. Для мутаций — обычный <form> + Server Action.
export function ProductSearch({ defaultQuery }: { defaultQuery?: string }) {
  return (
    <Form action="/products" className="flex gap-2">
      <input
        name="q"
        defaultValue={defaultQuery}
        placeholder="Поиск по названию"
        className="flex-1 rounded border px-3 py-2"
      />
      <button type="submit" className="rounded bg-zinc-100 px-4">
        Найти
      </button>
    </Form>
  );
}
