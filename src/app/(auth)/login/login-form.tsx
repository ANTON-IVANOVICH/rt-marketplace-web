"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type AuthState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus(); // статус ближайшей родительской <form>
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Вход…" : "Войти"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    login,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-3">
      <input
        name="email"
        type="email"
        required
        placeholder="email"
        className="w-full rounded border px-3 py-2"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="пароль"
        className="w-full rounded border px-3 py-2"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
