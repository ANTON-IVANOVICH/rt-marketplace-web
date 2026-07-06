"use client";

import Link from "next/link";
import { useOptimistic, useState, startTransition } from "react";
import { deleteProductAction } from "./actions";

type Item = { id: string; title: string };

export function ManageProducts({ initial }: { initial: Item[] }) {
  const [optimistic, removeOptimistic] = useOptimistic(
    initial,
    (state, idToRemove: string) => state.filter((p) => p.id !== idToRemove),
  );
  const [error, setError] = useState<string | null>(null);

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      removeOptimistic(id); // мгновенно убираем из UI
      try {
        await deleteProductAction(id); // при 403/404 бросит → React откатит
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
        // оптимистичное состояние само вернётся к базовому на следующем рендере
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <ul className="space-y-2">
        {optimistic.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded border px-3 py-2"
          >
            <span>{p.title}</span>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/products/${p.id}/manage`}
                className="text-zinc-600 hover:underline"
              >
                Фото
              </Link>
              <button
                onClick={() => onDelete(p.id)}
                className="text-red-600 hover:underline"
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
