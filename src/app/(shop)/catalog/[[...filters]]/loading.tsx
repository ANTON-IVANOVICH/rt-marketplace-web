export default function CatalogLoading() {
  return (
    <div>
      <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
      <div className="mt-2 h-7 w-56 animate-pulse rounded bg-zinc-100" />
      <ul className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="h-5 w-64 animate-pulse rounded bg-zinc-100" />
        ))}
      </ul>
    </div>
  );
}
