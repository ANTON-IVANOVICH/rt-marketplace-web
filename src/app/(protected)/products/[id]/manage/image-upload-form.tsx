"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadProductImageAction, type UploadState } from "./actions";

const MAX = 15 * 1024 * 1024;

function UploadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Загрузка…" : "Загрузить"}
    </button>
  );
}

export function ImageUploadForm({ productId }: { productId: string }) {
  const action = uploadProductImageAction.bind(null, productId); // productId → первый аргумент
  const [state, formAction] = useActionState<UploadState, FormData>(
    action,
    undefined,
  );
  const [clientError, setClientError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setClientError(
      f && f.size > MAX ? "Файл больше 15 МБ — выберите меньше." : null,
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        required
      />
      {clientError && <p className="text-sm text-red-600">{clientError}</p>}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Загружено.</p>}
      <UploadButton disabled={!!clientError} />
    </form>
  );
}
