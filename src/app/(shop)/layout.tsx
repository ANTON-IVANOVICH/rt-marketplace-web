import Link from "next/link";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8 flex items-center gap-6 border-b border-zinc-200 pb-4">
        <Link href="/" className="font-semibold">
          Marketplace
        </Link>
        <nav className="flex gap-4 text-sm text-zinc-600">
          <Link href="/products" className="hover:text-zinc-900">
            Товары
          </Link>
          <Link href="/catalog" className="hover:text-zinc-900">
            Каталог
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
