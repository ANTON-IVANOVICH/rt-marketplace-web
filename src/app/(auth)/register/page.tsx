import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Регистрация</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-zinc-600">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Войти
        </Link>
      </p>
    </main>
  );
}
