"use client";

import { useEffect } from "react";

export default function AppError({
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
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-red-800">
        Что-то пошло не так
      </h1>
      <p className="mt-2 text-zinc-600">
        Произошла непредвиденная ошибка. Попробуйте ещё раз.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded bg-red-600 px-4 py-2 text-sm text-white"
      >
        Повторить
      </button>
    </main>
  );
}
