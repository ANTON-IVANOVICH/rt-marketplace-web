"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SIZES = [10, 20, 50];

export function PageSizeSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = Number(searchParams.get("limit")) || 20;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", e.target.value);
    params.delete("cursor"); // сброс пагинации при смене размера страницы
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="text-sm text-zinc-600">
      На странице:{" "}
      <select
        value={current}
        onChange={onChange}
        className="rounded border border-zinc-300 px-2 py-1"
      >
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
