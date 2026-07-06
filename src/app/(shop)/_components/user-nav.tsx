import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logout } from "@/app/(auth)/actions";

// Читает cookie → динамика. В ShopLayout обёрнут в <Suspense>, поэтому остальная
// шапка остаётся статическим shell'ом, а имя пользователя стримится (PPR, этап 3).
export async function UserNav() {
  const user = await getCurrentUser();
  if (!user)
    return (
      <Link href="/login" className="text-sm hover:underline">
        Войти
      </Link>
    );
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/account" className="text-zinc-600 hover:text-zinc-900">
        {user.email}
      </Link>
      <form action={logout}>
        <button className="hover:underline">Выйти</button>
      </form>
    </div>
  );
}
