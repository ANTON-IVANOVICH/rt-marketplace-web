import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
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
