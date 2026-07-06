# Money Transfer MVP

MVP веб-сервісу обміну валют і комунікації з менеджером. Проєкт побудований як монорепо з React frontend і Node.js backend.

## Технології

- Frontend: React, Vite, Tailwind CSS, React Router, React Hook Form, Zod
- Backend: Node.js, Fastify, Prisma ORM
- Database: PostgreSQL
- Real-time foundation: Socket.IO буде додано на наступних етапах
- Tooling: TypeScript, ESLint, Prettier

## Структура

```text
apps/
  api/    # Fastify API, Prisma schema, seed
  web/    # React application, public/user/admin layouts
packages/
  config/ # shared TypeScript presets
```

## Локальний запуск

### 1. Підготувати Node.js

Рекомендована версія: Node.js 22 LTS.

### 2. Підготувати env

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

Заповни щонайменше:

- `DATABASE_URL`
- `COOKIE_SECRET`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_LOGIN_DOMAIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 3. Підняти PostgreSQL

Через Docker:

```bash
docker compose up -d postgres
```

Або використовуй власний локальний PostgreSQL і онови `DATABASE_URL`.

### 4. Встановити залежності

```bash
npm install
```

### 5. Ініціалізувати Prisma

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 6. Запустити проєкт

```bash
npm run dev
```

Після старту:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health endpoint: `http://localhost:4000/health`

## Що вже є на Етапі 1

- монорепо та workspace scripts
- базовий React frontend з публічним, user і admin layout
- Fastify API з health-check і bootstrap endpoint для публічного контенту
- Prisma schema з моделями під auth, контент, курси, заявки, чат, аудит
- seed для admin user, контенту, FAQ, банків, валют і курсів
- ESLint, Prettier, `.env.example`, `docker-compose.yml`

## Що буде на наступних етапах

- Етап 2: повноцінний лендінг з CMS-подачею контенту
- Етап 3: Telegram login з серверною валідацією
- Етап 4: кабінет користувача
- Етап 5: real-time чат user ↔ admin
- Етап 6: повноцінна адмінка
- Етап 7: реальні заявки на обмін
- Етап 8: полірування, SEO, фінальний onboarding

## Telegram для майбутніх етапів

Для входу через Telegram знадобиться:

- bot token від BotFather
- username бота
- домен, прив'язаний до Login Widget

На Етапі 1 це вже закладено у `env`, але сама авторизація буде реалізована на Етапі 3.
