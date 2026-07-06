import { getCurrentUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const user = (await getCurrentUser())!; // layout уже гарантировал наличие
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Личный кабинет</h1>
      <p className="mt-2 text-zinc-600">
        {user.email} · роль: {user.role}
      </p>
    </main>
  );
}
