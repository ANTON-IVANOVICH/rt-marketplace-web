"use client";

// Ловит ошибки самого корневого layout (сегментные error.tsx ловят остальное).
// Заменяет корневой layout целиком, поэтому ОБЯЗАН включать <html> и <body>.
// Только Client Component.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Что-то пошло не так</h2>
          {error.digest && (
            <p className="mt-1 text-sm text-zinc-500">Код: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-4 rounded bg-zinc-900 px-4 py-2 text-white"
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
