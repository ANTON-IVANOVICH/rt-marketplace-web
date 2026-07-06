// Обёртка над openapi-typescript: сначала пингует Fastify, и если он не поднят —
// печатает понятную подсказку вместо сырой сетевой ошибки, затем генерирует типы.
//
//   npm run gen:api
//   API_INTERNAL_URL=http://host:port npm run gen:api   # другой адрес
import { execFileSync } from "node:child_process";

const ORIGIN = (process.env.API_INTERNAL_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);
const HEALTH = `${ORIGIN}/api/v1/health`;
const DOCS = `${ORIGIN}/docs/json`;
const OUT = "src/lib/api/schema.d.ts";

async function main() {
  try {
    const res = await fetch(HEALTH, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`health ответил ${res.status}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`\n✖ Fastify недоступен по ${HEALTH} (${reason}).`);
    console.error(
      "  Подними API (в репозитории Fastify: npm run dev, порт :3000) и повтори `npm run gen:api`.",
    );
    console.error("  Другой адрес — задай переменную API_INTERNAL_URL.\n");
    process.exit(1);
  }

  console.log(`✓ Fastify доступен. Генерирую типы: ${DOCS} → ${OUT}`);
  execFileSync("npx", ["openapi-typescript", DOCS, "-o", OUT], {
    stdio: "inherit",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
