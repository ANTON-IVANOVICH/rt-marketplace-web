"use client";

import dynamic from "next/dynamic";

// Клиентская граница для ленивой загрузки. ssr:false нельзя вызывать из Server
// Component — оборачиваем в 'use client'. Панель завязана на браузерный
// WebSocket, серверный рендер ей не нужен → грузим её код только на клиенте,
// отдельным чанком (code-splitting).
const AuctionPanel = dynamic(
  () => import("./auction-panel").then((m) => m.AuctionPanel),
  {
    ssr: false,
    loading: () => <p className="text-zinc-500">Загрузка аукциона…</p>,
  },
);

export function AuctionPanelLoader(props: {
  productId: string;
  currency: string;
}) {
  return <AuctionPanel {...props} />;
}
