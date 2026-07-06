// Выполняется в браузере ДО клиентского кода приложения. Отдельный от серверного
// OTel слой: серверный трейс сюда не тянем (экспорт в Jaeger из браузера упёрся
// бы в CORS). Здесь — клиентская телеметрия: отчёты об ошибках, аналитика.
// Демонстрационный минимум: собираем необработанные ошибки клиента.

function report(kind: string, detail: unknown) {
  // В проде здесь был бы вызов Sentry/аналитики; в dev — просто в консоль.
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[client-telemetry] ${kind}`, detail);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => report("error", e.message));
  window.addEventListener("unhandledrejection", (e) =>
    report("unhandledrejection", e.reason),
  );
}

// Хук Next 16: старт клиентской навигации — точка для разметки переходов.
export function onRouterTransitionStart(url: string) {
  report("navigation", url);
}
