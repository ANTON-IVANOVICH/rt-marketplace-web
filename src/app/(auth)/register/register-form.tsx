"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register, type AuthState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Регистрируем…" : "Зарегистрироваться"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(
    register,
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
        minLength={8}
        placeholder="пароль (минимум 8 символов)"
        className="w-full rounded border px-3 py-2"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
