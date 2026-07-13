# Combined image for a single-service, same-origin deploy (e.g. Render).
# The API serves the built SPA and handles /api + /socket.io on one port.
#
#   docker build -t moneytransfer .
#   docker run -p 4000:4000 --env-file .env moneytransfer
#
# Debian-slim base (not Alpine): Prisma's recommended, most reliable runtime.
FROM node:22-slim AS builder

# openssl + ca-certificates: required by Prisma and for TLS during engine download.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Build-time frontend config. Leave VITE_API_URL empty for same-origin.
ARG VITE_API_URL=""
ARG VITE_TELEGRAM_BOT_USERNAME="replace_with_bot_username"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TELEGRAM_BOT_USERNAME=$VITE_TELEGRAM_BOT_USERNAME

# prisma.config.ts requires DATABASE_URL just to load; `prisma generate` never
# connects, so a placeholder is enough at build time. The real DATABASE_URL is
# injected at runtime (Render / docker run).
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/

RUN npm ci

COPY packages/config packages/config
COPY apps/api apps/api
COPY apps/web apps/web

# Build in separate steps so memory is released between them and failures are
# easy to pinpoint. The web build skips the type-check pass (already enforced
# in CI) to keep peak memory low on constrained build hosts.
RUN npm run build:docker --workspace @moneytransfer/web
RUN npm run build --workspace @moneytransfer/api

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# The API serves the SPA from this directory.
ENV WEB_DIST=/app/apps/web/dist
WORKDIR /app/apps/api

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/apps/web/dist /app/apps/web/dist

EXPOSE 4000

# Apply migrations, seed baseline data (idempotent — never clobbers edits),
# then start. Render runs this as the service command.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/server.js"]
