// Стриминговый Route Handler, производящий SSE. Полный разбор Route Handlers —
// на следующем шаге; здесь — паттерн стриминга как альтернатива WebSocket.
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      let n = 0;
      interval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ tick: n++ })}\n\n`),
          );
        } catch {
          clearInterval(interval);
        }
      }, 1000);
    },
    cancel() {
      clearInterval(interval);
    },
  });

  request.signal.addEventListener("abort", () => clearInterval(interval));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
