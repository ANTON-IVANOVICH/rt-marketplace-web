export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(
    cents / 100,
  );
}
