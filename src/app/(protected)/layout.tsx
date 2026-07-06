import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

// Реальная проверка (в отличие от оптимистичного proxy): один гейт на всю группу.
// Читает cookie, поэтому это динамика — держим её под собственным <Suspense>, иначе
// под Cache Components layout уронил бы «uncached data outside Suspense». Дочерние
// страницы рендерятся уже за этим гейтом (и внутри той же границы Suspense).
async function AuthGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(); // через Fastify /users/me — настоящая валидация
  if (!user) redirect("/login");
  return <>{children}</>;
}

function GateFallback() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="h-7 w-48 animate-pulse rounded bg-zinc-100" />
      <div className="mt-2 h-5 w-64 animate-pulse rounded bg-zinc-100" />
    </main>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<GateFallback />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
