"use client";

import { useState } from "react";
import { useAuctionSocket } from "./use-auction-socket";
import { formatPrice } from "@/lib/format";

export function AuctionPanel({
  productId,
  currency,
}: {
  productId: string;
  currency: string;
}) {
  const {
    state,
    connected,
    displayPrice,
    optimisticPending,
    rejection,
    placeBid,
  } = useAuctionSocket(productId);
  const [amount, setAmount] = useState("");

  if (!state) return <p className="text-zinc-500">Подключаемся к аукциону…</p>;
  const ended = state.status === "ended";

  return (
    <div className="rounded-lg border p-4">
      <p className="text-xl">
        {formatPrice(displayPrice, currency)}
        {optimisticPending && (
          <span className="ml-2 text-sm text-amber-600">ваша ставка…</span>
        )}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        Ставок: {state.bidsCount} · {connected ? "онлайн" : "переподключение…"}
      </p>
      {rejection && <p className="mt-2 text-sm text-red-600">{rejection}</p>}

      {!ended ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            placeBid(Math.round(Number(amount) * 100));
            setAmount("");
          }}
        >
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="flex-1 rounded border px-3 py-2"
            placeholder="Ваша ставка"
          />
          <button
            disabled={!connected}
            className="rounded bg-zinc-900 px-4 text-white disabled:opacity-50"
          >
            Ставка
          </button>
        </form>
      ) : (
        <p className="mt-3 font-medium">Аукцион завершён.</p>
      )}
    </div>
  );
}
