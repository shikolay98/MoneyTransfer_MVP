import bcrypt from 'bcryptjs';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';

import { env } from '../config/env.js';
import { requireAuth } from '../lib/auth-guard.js';
import { verifyTelegramAuth, type TelegramAuthData } from '../lib/telegram-auth.js';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const telegramAuthSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

const setAuthCookie = (reply: FastifyReply, token: string) => {
  void reply.setCookie(env.COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
};

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/auth/admin/login', async (request, reply) => {
    const body = adminLoginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const user = await app.prisma.user.findUnique({
      where: { email: body.data.email },
    });

    if (!user || !user.passwordHash || user.role !== 'ADMIN') {
      return reply.status(401).send({ error: 'Неверный логин или пароль' });
    }

    const valid = await bcrypt.compare(body.data.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Неверный логин или пароль' });
    }

    const token = app.jwt.sign({ userId: user.id, role: user.role });
    setAuthCookie(reply, token);

    return {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      email: user.email,
    };
  });

  app.post('/api/auth/telegram', async (request, reply) => {
    const body = telegramAuthSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные Telegram' });
    }

    const authData = body.data as TelegramAuthData;

    if (env.TELEGRAM_BOT_TOKEN !== 'replace_with_bot_token') {
      const isValid = verifyTelegramAuth(authData, env.TELEGRAM_BOT_TOKEN);
      if (!isValid) {
        return reply.status(401).send({ error: 'Неверная подпись Telegram' });
      }
    }

    const telegramId = String(authData.id);

    let user = await app.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      user = await app.prisma.user.create({
        data: {
          telegramId,
          telegramUsername: authData.username ?? null,
          firstName: authData.first_name,
          lastName: authData.last_name ?? null,
          photoUrl: authData.photo_url ?? null,
          role: 'USER',
        },
      });
    } else {
      user = await app.prisma.user.update({
        where: { telegramId },
        data: {
          telegramUsername: authData.username ?? user.telegramUsername,
          firstName: authData.first_name,
          lastName: authData.last_name ?? user.lastName,
          photoUrl: authData.photo_url ?? user.photoUrl,
        },
      });
    }

    const token = app.jwt.sign({ userId: user.id, role: user.role });
    setAuthCookie(reply, token);

    return {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      telegramUsername: user.telegramUsername,
      photoUrl: user.photoUrl,
    };
  });

  app.get('/api/auth/me', { preHandler: requireAuth }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.userId },
    });

    if (!user) {
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
