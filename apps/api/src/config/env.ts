import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_URL: z.string().url(),
  API_URL: z.string().url(),
  CORS_ORIGIN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  COOKIE_NAME: z.string().min(1).default('mt_session'),
  COOKIE_SECRET: z.string().min(16),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
  JWT_SECRET: z.string().min(16),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_USERNAME: z.string().min(1),
  TELEGRAM_LOGIN_DOMAIN: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_NAME: z.string().min(1),
});

export const env = envSchema.parse(process.env);

export type AppEnv = typeof env;
