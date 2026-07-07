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

# 2. (Опційно) вкажіть публічний origin, якщо це не http://localhost:8080:
#    export PUBLIC_ORIGIN=https://exchange.example.com

# 3. Повний стек: postgres + api (з міграціями) + web (nginx, порт 8080)
docker compose up -d --build

# 4. Первинний seed (адмін, валюти, банки, контент)
docker compose exec api npx prisma db seed
```

nginx у контейнері web роздає SPA і проксить `/api`, `/socket.io`, `/health` на api — REST-запити йдуть same-origin. **Важливо:** Socket.IO все одно перевіряє `Origin` handshake на боці сервера, тому `CORS_ORIGIN` має дорівнювати публічному origin сайту. У compose це керується змінною `PUBLIC_ORIGIN` (за замовчуванням `http://localhost:8080`), яка проставляється в `CORS_ORIGIN`, `WEB_URL`, `API_URL` сервісу api. Для реального домену задайте `PUBLIC_ORIGIN` і перезберіть web з відповідним `VITE_API_URL` (порожній рядок = same-origin). Для HTTPS поставте зовнішній reverse-proxy (Caddy/Traefik/nginx з certbot) перед портом 8080 і лишіть `TRUST_PROXY=true`.

Health-чеки: `GET /health` (liveness), `GET /health/ready` (readiness, перевіряє БД).

## Безкоштовний деплой на Render (без домену)

Кореневий `Dockerfile` збирає **один образ**, де API роздає і зібраний фронтенд,
і `/api` + `/socket.io` — усе з одного origin (без CORS/куки-проблем). `render.yaml`
описує безкоштовний PostgreSQL + цей web-сервіс.

1. Створіть Telegram-бота через [@BotFather](https://t.me/BotFather) → `/newbot` → збережіть **token** і **username**.
2. Залийте репозиторій на GitHub.
3. На [render.com](https://render.com) → **New → Blueprint** → підключіть репозиторій (Render підхопить `render.yaml`).
4. У змінних сервісу (Environment) задайте: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`,
   `VITE_TELEGRAM_BOT_USERNAME` (те саме, що username), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   а `TELEGRAM_LOGIN_DOMAIN` = хост вашого сервісу (напр. `moneytransfer.onrender.com`, без `https://`).
5. Deploy. Після старту скопіюйте URL сервісу і в @BotFather виконайте `/setdomain` → вкажіть цей самий хост.

`COOKIE_SECRET`/`JWT_SECRET` Render генерує сам; міграції та seed виконуються при старті.
Health-check шлях уже налаштовано (`/health`). Free-план засинає після простою — перший
захід прокидається ~30–50 сек. Завантажені файли на free-плані не переживають рестарт
(ephemeral disk) — для постійного зберігання додайте платний диск або зовнішнє сховище.

Той самий образ можна запустити будь-де:

```bash
docker build -t moneytransfer .
docker run -p 4000:4000 --env-file .env -e WEB_DIST=/app/apps/web/dist moneytransfer
```

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
