"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProductAction, type CreateProductState } from "./actions";

function Field({
  name,
  label,
  type = "text",
  error,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        className="mt-1 w-full rounded border px-3 py-2 aria-[invalid=true]:border-red-500"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus(); // статус РОДИТЕЛЬСКОЙ формы; живёт в дочернем компоненте
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Создаём…" : "Создать товар"}
    </button>
  );
}

export function CreateProductForm() {
  const [state, formAction] = useActionState<CreateProductState, FormData>(
    createProductAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        name="title"
        label="Название"
        error={state?.fieldErrors?.title}
        defaultValue={state?.values?.title}
      />
      <Field
        name="description"
        label="Описание"
        error={state?.fieldErrors?.description}
        defaultValue={state?.values?.description}
      />
      <Field
        name="priceCents"
        label="Цена (в копейках)"
        type="number"
        error={state?.fieldErrors?.priceCents}
        defaultValue={state?.values?.priceCents}
      />
      <Field
        name="stock"
        label="Остаток"
        type="number"
        error={state?.fieldErrors?.stock}
        defaultValue={state?.values?.stock}
      />
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
