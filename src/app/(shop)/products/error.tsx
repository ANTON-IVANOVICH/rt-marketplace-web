"use client";

import { useEffect } from "react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="font-medium text-red-800">Не удалось загрузить товары</h2>
      <button
        onClick={reset}
        className="mt-4 rounded bg-red-600 px-3 py-1.5 text-sm text-white"
      >
        Повторить
      </button>
    </div>
  );
}
