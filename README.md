# Money Transfer

Веб-сервіс безготівкового обміну валют (RUB ↔ UAH) з особистим кабінетом, real-time чатом з менеджером і повноцінною адмінкою. Монорепо: React frontend + Fastify backend.

## Можливості

**Публічна частина**
- Лендінг з CMS-контентом (hero, переваги, «як це працює», FAQ, футер) — все редагується з адмінки
- Форма заявки на обмін з розрахунком суми до отримання (з урахуванням комісії)
- Актуальні курси, тикер у шапці
- Вхід через Telegram Login Widget (з серверною перевіркою підпису)
- Сторінки Політики конфіденційності та Умов використання (CMS)
- SEO: favicon, OG/Twitter-меги, robots.txt, заголовки сторінок

**Кабінет користувача**
- Історія заявок зі статусами
- Real-time чат з менеджером (Socket.IO, автоперепідключення)
- Створення заявки і «загального» чату з менеджером

**Адмінка** (`/admin`)
- Курси і комісії (з журналюванням змін)
- CMS-контент сторінок та FAQ
- Заявки (зміна статусів) і користувачі
- Чати з користувачами в реальному часі
- Всі мутації пишуться в аудит-лог (`AuditLog`)

## Технології

- **Frontend:** React 19, Vite 6, Tailwind CSS, React Router 7 (lazy-роути), React Hook Form + Zod, socket.io-client
- **Backend:** Node.js 22, Fastify 5, Prisma 6, Socket.IO, Zod, @fastify/jwt (httpOnly cookie), @fastify/helmet, @fastify/rate-limit
- **База:** PostgreSQL 16
- **Тести:** Vitest
- **Деплой:** Docker (multi-stage) + docker-compose + nginx (SPA + проксі API/WebSocket, same-origin без CORS)

## Безпека

- Socket.IO автентифікується JWT-кукою при handshake; підписка на тред можлива лише власнику або адміну
- Перевірка підпису Telegram Login (HMAC, constant-time, TTL 24 год); у production плейсхолдерний токен не пройде валідацію env — сервер не стартує
- Rate limiting: глобальний (300/хв) + жорсткі ліміти на логін (5/хв), Telegram-вхід (10/хв), заявки (10/хв), повідомлення (60/хв)
- Глобальний error handler: помилки Prisma мапляться в 400/404/409, внутрішні деталі не витікають
- Валідація всіх вхідних даних (Zod) з лімітами довжин і значень
- `isActive` користувача перевіряється при вході та в `/api/auth/me`
- Секрети-плейсхолдери блокуються в production на рівні валідації env

## Структура

```text
apps/
  api/    # Fastify API, Prisma schema, seed, тести, Dockerfile
  web/    # React SPA, nginx.conf, Dockerfile
packages/
  config/ # спільні TypeScript-пресети
```

## Локальний запуск (розробка)

Потрібен Node.js 22 LTS і Docker (для PostgreSQL).

```bash
# 1. Env
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env

# 2. База
docker compose up -d postgres

# 3. Залежності та схема
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Запуск (web: 5173, api: 4000)
npm run dev
```

Адмінка: `http://localhost:5173/admin/login`, дані — `ADMIN_EMAIL` / `ADMIN_PASSWORD` з `.env`.

### Скрипти

| Команда | Опис |
| --- | --- |
| `npm run dev` | web + api у watch-режимі |
| `npm run build` | збірка всіх пакетів |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run typecheck` | перевірка типів у всіх пакетах |
| `npm run test` | Vitest-тести API |
| `npm run db:generate` / `db:migrate` / `db:seed` | Prisma |

### Seed

Seed ідемпотентний і **не перезаписує** контент, курси чи пароль адміна при повторному запуску:

- `SEED_FORCE_CONTENT=true npm run db:seed` — перезаписати CMS-контент і FAQ дефолтами
- `SEED_RESET_ADMIN_PASSWORD=true npm run db:seed` — скинути пароль адміна до `ADMIN_PASSWORD`

## Продакшн-деплой (Docker)

```bash
# 1. Заповніть .env реальними значеннями:
#    COOKIE_SECRET, JWT_SECRET (openssl rand -hex 32),
#    TELEGRAM_BOT_TOKEN/USERNAME, ADMIN_EMAIL/PASSWORD.
#    З плейсхолдерами API у production не стартує.

# 2. Повний стек: postgres + api (з міграціями) + web (nginx, порт 8080)
docker compose up -d --build

# 3. Первинний seed (адмін, валюти, банки, контент)
docker compose exec api npx prisma db seed
```

nginx у контейнері web роздає SPA і проксить `/api`, `/socket.io`, `/health` на api — фронтенд і бекенд працюють same-origin, CORS не потрібен. Для HTTPS поставте зовнішній reverse-proxy (Caddy/Traefik/nginx з certbot) перед портом 8080 і лишіть `TRUST_PROXY=true`.

Health-чеки: `GET /health` (liveness), `GET /health/ready` (readiness, перевіряє БД).

## Telegram Login

1. Створіть бота через [@BotFather](https://t.me/BotFather), отримайте токен
2. Виконайте `/setdomain` і прив'яжіть домен сайту
3. Заповніть `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_LOGIN_DOMAIN`, `VITE_TELEGRAM_BOT_USERNAME`

У локальній розробці з плейсхолдерним токеном перевірка підпису вимкнена (тільки `NODE_ENV=development`); кнопка входу ховається, якщо бот не сконфігурований.

## Дорожня карта

- Server-side сесії з відкликанням (модель `Session` вже в схемі)
- Пагінація адмінських списків понад 500 записів
- Push/Telegram-нотифікації менеджеру про нові заявки
- CAPTCHA на анонімну заявку при зростанні спаму
