import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { clientConfig } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  // Абсолютные URL (og:image и т.п.) резолвятся против этого адреса Next-приложения.
  // Без него Next по умолчанию берёт http://localhost:3000 — это Fastify, не мы.
  metadataBase: new URL(clientConfig.NEXT_PUBLIC_APP_URL),
  title: { default: "Marketplace", template: "%s · Marketplace" },
  description: "Next.js 16 фронтенд поверх Fastify API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-dvh bg-white font-sans text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
