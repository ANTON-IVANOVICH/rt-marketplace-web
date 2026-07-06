# Многоступенчатая сборка: ставим зависимости → собираем → runner на standalone-выводе.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# env.ts валидирует env при загрузке модулей во время сборки (Collecting page
# data), а .env.local в контекст сборки не попадает (.dockerignore). Поэтому
# обязательные переменные подаём здесь. NEXT_PUBLIC_* ИНЛАЙНЯТСЯ в клиентский
# бандл на сборке — их реальные публичные значения должны быть известны сейчас
# (передаются из compose через build.args). Серверные секреты на сборке — любые
# непустые заглушки: реальные значения приходят из compose в рантайме (сервер
# перечитывает process.env при старте).
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ARG NEXT_PUBLIC_WS_URL=ws://localhost:3000
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV API_INTERNAL_URL=http://build-placeholder:3000
ENV WEBHOOK_SECRET=build-placeholder
ENV DRAFT_SECRET=build-placeholder
# DOCKER_BUILD включает output:'standalone' И cacheHandlers→Redis (флаг гейтит
# next.config). Ставить на билде обязательно: с standalone конфиг замораживается,
# и заодно так `redis` трейсится в standalone node_modules.
# schema.d.ts закоммичен — gen:api не нужен на сборке (требует живого Fastify).
ENV DOCKER_BUILD=true
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# output:'standalone' даёт самодостаточный server.js + минимальные node_modules.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Кеш-хендлер грузится по абсолютному пути из next.config (адрес Redis берёт из
# REDIS_URL в рантайме); путь /app/cache-handlers совпадает с билд-стадией.
COPY --from=builder /app/cache-handlers ./cache-handlers
EXPOSE 3001
CMD ["node", "server.js"]
