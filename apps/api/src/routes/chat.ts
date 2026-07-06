import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../lib/auth-guard.js';

const chatRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/chats/my', { preHandler: requireAuth }, async (request) => {
    const threads = await app.prisma.chatThread.findMany({
      where: { userId: request.user.userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        exchangeRequest: { select: { id: true, status: true } },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
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
    const { threadId } = request.params as { threadId: string };

    const thread = await app.prisma.chatThread.findUnique({ where: { id: threadId } });

    if (!thread || thread.userId !== request.user.userId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const messages = await app.prisma.chatMessage.findMany({
      where: { threadId },
      include: { sender: { select: { id: true, firstName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  });

  app.post('/api/chats/:threadId/messages', { preHandler: requireAuth }, async (request, reply) => {
    const { threadId } = request.params as { threadId: string };
    const body = z.object({ body: z.string().min(1) }).safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({ error: 'Пустое сообщение' });
    }

    const thread = await app.prisma.chatThread.findUnique({ where: { id: threadId } });

    if (!thread || thread.userId !== request.user.userId) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const message = await app.prisma.chatMessage.create({
      data: {
        threadId,
        senderId: request.user.userId,
        senderRole: 'USER',
        body: body.data.body,
        status: 'SENT',
      },
      include: { sender: { select: { id: true, firstName: true, role: true } } },
    });

    await app.prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });

    app.io.to(`thread:${threadId}`).emit('new_message', message);

    return message;
  });

  app.post('/api/chats', { preHandler: requireAuth }, async (request, reply) => {
    const body = z.object({ subject: z.string().optional() }).safeParse(request.body);
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
        subject: body.data.subject ?? 'Общий вопрос',
      },
    });
  });
};

export default chatRoutes;
