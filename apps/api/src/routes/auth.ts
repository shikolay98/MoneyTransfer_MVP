import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';

import { env, TELEGRAM_TOKEN_PLACEHOLDER } from '../config/env.js';
import { audit } from '../lib/audit.js';
import { requireAuth } from '../lib/auth-guard.js';
import { verifyTelegramAuth, type TelegramAuthData } from '../lib/telegram-auth.js';

const COOKIE_MAX_AGE_SECONDS = env.SESSION_TTL_HOURS * 60 * 60;

const adminLoginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

const telegramAuthSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().max(200),
  last_name: z.string().max(200).optional(),
  username: z.string().max(200).optional(),
  photo_url: z.string().url().max(500).optional(),
  auth_date: z.number().int().positive(),
  hash: z.string().max(200),
});

const setAuthCookie = (reply: FastifyReply, token: string) => {
  void reply.setCookie(env.COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
};

const strictRateLimit = (max: number) => ({
  rateLimit: {
    max,
    timeWindow: '1 minute',
  },
});

// Compared against when the user is unknown so response timing stays constant.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equalizer-placeholder', 10);

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/api/auth/admin/login',
    { config: strictRateLimit(5) },
    async (request, reply) => {
      const body = adminLoginSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Неверные данные' });
      }

      const user = await app.prisma.user.findUnique({
        where: { email: body.data.email },
      });

      // Always run bcrypt to keep the response timing independent of user existence.
      const valid = await bcrypt.compare(
        body.data.password,
        user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      );

      if (!user || !user.passwordHash || user.role !== 'ADMIN' || !valid) {
        return reply.status(401).send({ error: 'Неверный логин или пароль' });
      }

      if (!user.isActive) {
        return reply.status(403).send({ error: 'Аккаунт деактивирован' });
      }

      const token = app.jwt.sign({ userId: user.id, role: user.role });
      setAuthCookie(reply, token);

      audit(app, {
        actorId: user.id,
        action: 'auth.admin_login',
        entityType: 'User',
        entityId: user.id,
      });

      return {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        email: user.email,
      };
    },
  );

  app.post(
    '/api/auth/telegram',
    { config: strictRateLimit(10) },
    async (request, reply) => {
      const body = telegramAuthSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Неверные данные Telegram' });
      }

      const authData = body.data as TelegramAuthData;

      // Signature verification may be skipped only in local development
      // while the bot token is still a placeholder. In production the env
      // schema rejects the placeholder, so verification always runs.
      const skipVerification =
        env.NODE_ENV === 'development' && env.TELEGRAM_BOT_TOKEN === TELEGRAM_TOKEN_PLACEHOLDER;

      if (!skipVerification && !verifyTelegramAuth(authData, env.TELEGRAM_BOT_TOKEN)) {
        return reply.status(401).send({ error: 'Неверная подпись Telegram' });
      }

      const telegramId = String(authData.id);

      const existing = await app.prisma.user.findUnique({ where: { telegramId } });

      if (existing && !existing.isActive) {
        return reply.status(403).send({ error: 'Аккаунт деактивирован' });
      }

      const user = existing
        ? await app.prisma.user.update({
            where: { telegramId },
            data: {
              telegramUsername: authData.username ?? existing.telegramUsername,
              firstName: authData.first_name,
              lastName: authData.last_name ?? existing.lastName,
              photoUrl: authData.photo_url ?? existing.photoUrl,
            },
          })
        : await app.prisma.user.create({
            data: {
              telegramId,
              telegramUsername: authData.username ?? null,
              firstName: authData.first_name,
              lastName: authData.last_name ?? null,
              photoUrl: authData.photo_url ?? null,
              role: 'USER',
            },
          });

      const token = app.jwt.sign({ userId: user.id, role: user.role });
      setAuthCookie(reply, token);

      return {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        telegramUsername: user.telegramUsername,
        photoUrl: user.photoUrl,
      };
    },
  );

  app.get('/api/auth/me', { preHandler: requireAuth }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      telegramUsername: user.telegramUsername,
      photoUrl: user.photoUrl,
    };
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    reply.clearCookie(env.COOKIE_NAME, { path: '/' });
    return { ok: true };
  });
};

export default authRoutes;
