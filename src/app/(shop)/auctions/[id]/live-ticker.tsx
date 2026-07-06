"use client";

import { useEffect, useState } from "react";

// Односторонний поток сервер→клиент через SSE (EventSource сам переподключается,
// идёт по обычному HTTP). Контраст с двунаправленным WS аукциона выше.
export function LiveTicker() {
  const [last, setLast] = useState("");
  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => setLast(e.data);
    return () => es.close(); // cleanup
  }, []);
  return <p className="mt-4 text-xs text-zinc-400">SSE-тик: {last}</p>;
}
