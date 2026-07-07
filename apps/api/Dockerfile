# Build from the repository root:
#   docker build -f apps/api/Dockerfile -t moneytransfer-api .
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/

RUN npm ci

COPY packages/config packages/config
COPY apps/api apps/api

RUN npm run build --workspace @moneytransfer/api

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# node_modules includes the prisma CLI so the container can run
# `prisma migrate deploy` before starting (see docker-compose.yml).
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts apps/api/

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/server.js"]
