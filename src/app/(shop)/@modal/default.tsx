// Слот @modal рендерит default, когда нет перехвата (обычная загрузка /products,
// hard-навигация, refresh). Без default.tsx слот вернул бы 404 на неперехваченных
// маршрутах.
export default function Default() {
  return null;
}
