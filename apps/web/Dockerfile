# Build from the repository root:
#   docker build -f apps/web/Dockerfile -t moneytransfer-web .
FROM node:22-alpine AS builder

# Leave VITE_API_URL empty for same-origin deployment: nginx in this image
# proxies /api and /socket.io to the API container.
ARG VITE_API_URL=""
ARG VITE_TELEGRAM_BOT_USERNAME="replace_with_bot_username"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TELEGRAM_BOT_USERNAME=$VITE_TELEGRAM_BOT_USERNAME

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/

RUN npm ci

COPY packages/config packages/config
COPY apps/web apps/web

RUN npm run build --workspace @moneytransfer/web

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
