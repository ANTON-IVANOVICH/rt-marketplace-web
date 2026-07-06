import { registerOTel } from "@vercel/otel";

// Выполняется до остального серверного кода в новом окружении. @vercel/otel
// авто-инструментирует fetch и пробрасывает W3C trace context (traceparent):
// когда наши apiPublic/apiAuthed зовут Fastify, спан Next связывается со спаном
// Fastify, а тот добавляет спаны Postgres. Оба экспортируют в ТОТ ЖЕ Jaeger
// (OTEL_EXPORTER_OTLP_ENDPOINT) → в UI один сквозной трейс Next→Fastify→Postgres.
// Endpoint и имя сервиса читаются из env (OTEL_EXPORTER_OTLP_ENDPOINT добавляет
// /v1/traces сам). serviceName держим ОТЛИЧНЫМ от Fastify.
export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "marketplace-web",
  });
}
