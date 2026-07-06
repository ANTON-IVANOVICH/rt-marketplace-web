import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium text-zinc-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Страница не найдена</h1>
      <p className="mt-2 text-zinc-600">
        Такой страницы нет или она была перемещена.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
      >
        На главную
      </Link>
    </main>
  );
}
