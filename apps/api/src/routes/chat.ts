import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../lib/auth-guard.js';
import {
  createChatMessage,
  loadThreadMessages,
  MAX_MESSAGE_LENGTH,
} from '../lib/chat-service.js';

const messageSchema = z.object({ body: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH) });
const threadParamsSchema = z.object({ threadId: z.string().min(1).max(64) });

const chatRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/chats/my', { preHandler: requireAuth }, async (request) => {
    const threads = await app.prisma.chatThread.findMany({
      where: { userId: request.user.userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        exchangeRequest: { select: { id: true, status: true } },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      take: 100,
    });

    return threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      lastMessage: t.messages[0]?.body ?? null,
      lastMessageAt: t.lastMessageAt,
      exchangeRequest: t.exchangeRequest,
    }));
  });

  app.get('/api/chats/:threadId/messages', { preHandler: requireAuth }, async (request, reply) => {
    const params = threadParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Неверный идентификатор чата' });
    }

    const thread = await app.prisma.chatThread.findUnique({
      where: { id: params.data.threadId },
    });

    if (!thread || thread.userId !== request.user.userId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    return loadThreadMessages(app, thread.id);
  });

  app.post(
    '/api/chats/:threadId/messages',
    { preHandler: requireAuth, config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const params = threadParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: 'Неверный идентификатор чата' });
      }

      const body = messageSchema.safeParse(request.body);
      if (!body.success) {
        return reply.status(400).send({ error: 'Пустое или слишком длинное сообщение' });
      }

      const thread = await app.prisma.chatThread.findUnique({
        where: { id: params.data.threadId },
      });

      if (!thread || thread.userId !== request.user.userId) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return createChatMessage(app, {
        threadId: thread.id,
        senderId: request.user.userId,
        senderRole: 'USER',
        body: body.data.body,
      });
    },
  );

  app.post('/api/chats', { preHandler: requireAuth }, async (request, reply) => {
    const body = z
      .object({ subject: z.string().trim().max(200).optional() })
      .safeParse(request.body ?? {});
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const existing = await app.prisma.chatThread.findFirst({
      where: { userId: request.user.userId, exchangeRequestId: null },
    });

    if (existing) {
      return existing;
    }

    return app.prisma.chatThread.create({
      data: {
        userId: request.user.userId,
        subject: body.data.subject || 'Общий вопрос',
        lastMessageAt: new Date(),
      },
    });
  });
};

export default chatRoutes;
