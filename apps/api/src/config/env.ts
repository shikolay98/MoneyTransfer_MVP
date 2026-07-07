import { z } from 'zod';

const PLACEHOLDER_SECRETS = new Set([
  'change_me_cookie_secret_32_chars',
  'change_me_jwt_secret_32_chars',
]);

export const TELEGRAM_TOKEN_PLACEHOLDER = 'replace_with_bot_token';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    // URLs are informational/logging; default so the app boots before the
    // public URL is known (e.g. first deploy on a PaaS).
    WEB_URL: z.string().url().default('http://localhost:5173'),
    API_URL: z.string().url().default('http://localhost:4000'),
    // Optional: comma-separated allowed origins. When unset the app treats
    // requests as same-origin (reflects the request origin) — the setup used
    // when the API also serves the built frontend.
    CORS_ORIGIN: z.string().optional(),
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
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
    UPLOAD_DIR: z.string().min(1).default('uploads'),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(50).default(10),
    // Absolute path to the built web app. When set, the API serves the SPA
    // from this directory (same-origin deploy).
    WEB_DIST: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') {
      return;
    }

    // Fail closed: placeholder secrets must never reach production.
    for (const key of ['COOKIE_SECRET', 'JWT_SECRET'] as const) {
      if (PLACEHOLDER_SECRETS.has(value[key])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} must be replaced with a real secret in production`,
        });
      }
    }

    if (value.TELEGRAM_BOT_TOKEN === TELEGRAM_TOKEN_PLACEHOLDER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TELEGRAM_BOT_TOKEN'],
        message: 'TELEGRAM_BOT_TOKEN must be a real bot token in production',
      });
    }
  });

export const env = envSchema.parse(process.env);

// Allowed CORS/Socket.IO origins. A comma-separated list restricts to those
// origins; when unset we reflect the request origin (`true`) — correct for a
// same-origin deploy where the API also serves the frontend. Auth is still
// gated by the httpOnly session cookie, so reflecting the origin is safe.
const parsedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

export const corsOrigin: string[] | true = parsedOrigins.length > 0 ? parsedOrigins : true;

export type AppEnv = typeof env;
