"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getAuctionTicket } from "../actions";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL!;

type AuctionState = {
  currentPriceCents: number;
  bidsCount: number;
  endsAt: string;
  status: string;
};

// Форма событий подтверждена пробой реального Fastify WS.
type AuctionEvent =
  | {
      type: "auction:state";
      currentPriceCents: number;
      bidsCount: number;
      endsAt: string;
      status: string;
    }
  | {
      type: "bid:placed";
      currentPriceCents: number;
      bid: { amountCents: number };
    }
  | { type: "bid:rejected"; code: string; message: string }
  | { type: "auction:ended"; finalPriceCents: number; winnerId?: string };

export function useAuctionSocket(productId: string) {
  const [state, setState] = useState<AuctionState | null>(null);
  const [connected, setConnected] = useState(false);
  const [optimisticBid, setOptimisticBid] = useState<number | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUs = useRef(false);
  // Держим последнюю версию connect в ref, чтобы реконнект вызывал её через ref,
  // а не ссылался на useCallback внутри самого себя.
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(async () => {
    const ticket = await getAuctionTicket();
    if (!ticket) return;

    const ws = new WebSocket(
      `${WS_BASE}/api/v1/auctions/${productId}/ws?token=${encodeURIComponent(ticket)}`,
    );
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      if (!closedByUs.current)
        reconnectRef.current = setTimeout(() => connectRef.current(), 2000); // авто-реконнект
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as AuctionEvent;
      switch (msg.type) {
        case "auction:state":
          setState({
            currentPriceCents: msg.currentPriceCents,
            bidsCount: msg.bidsCount,
            endsAt: msg.endsAt,
            status: msg.status,
          });
          break;
        case "bid:placed":
          setState((s) =>
            s
              ? {
                  ...s,
                  currentPriceCents: msg.currentPriceCents,
                  bidsCount: s.bidsCount + 1,
                }
              : s,
          );
          setOptimisticBid(null); // broadcast подтвердил → снимаем оптимизм
          break;
        case "bid:rejected":
          setOptimisticBid(null); // откат оптимистичной ставки
          setRejection(msg.message);
          break;
        case "auction:ended":
          setState((s) =>
            s
              ? { ...s, status: "ended", currentPriceCents: msg.finalPriceCents }
              : s,
          );
          break;
      }
    };
  }, [productId]);

  useEffect(() => {
    connectRef.current = connect;
    closedByUs.current = false;
    connect();
    return () => {
      closedByUs.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [connect]);

  const placeBid = useCallback((amountCents: number) => {
    setRejection(null);
    setOptimisticBid(amountCents); // оптимистично показываем сразу
    socketRef.current?.send(JSON.stringify({ type: "bid:place", amountCents }));
  }, []);

  const displayPrice = optimisticBid ?? state?.currentPriceCents ?? 0;
  return {
    state,
    connected,
    displayPrice,
    optimisticPending: optimisticBid !== null,
    rejection,
    placeBid,
  };
}
