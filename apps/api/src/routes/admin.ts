import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { audit } from '../lib/audit.js';
import { requireAdmin } from '../lib/auth-guard.js';
import {
  attachUnreadForAdmin,
  createChatMessage,
  loadThreadMessages,
  streamThreadAttachment,
} from '../lib/chat-service.js';
import { messageSchema } from './chat.js';

const idParamsSchema = z.object({ id: z.string().min(1).max(64) });
const threadParamsSchema = z.object({ threadId: z.string().min(1).max(64) });

const updateRateSchema = z.object({
  rate: z.coerce.number().positive().max(1_000_000),
  feePercent: z.coerce.number().min(0).max(100).nullish(),
  note: z.string().max(500).nullish(),
  isActive: z.boolean().optional(),
});

const updateContentSchema = z.object({
  title: z.string().max(500).optional(),
  subtitle: z.string().max(500).optional(),
  body: z.string().max(20_000).optional(),
  metadata: z.unknown().optional(),
  isPublished: z.boolean().optional(),
});

const updateFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isPublished: z.boolean().optional(),
});

const updateRequestStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

const requestsQuerySchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

const adminRoutes: FastifyPluginAsync = async (app) => {
  // ── Rates ──────────────────────────────────────────────────────────────
  app.get('/api/admin/rates', { preHandler: requireAdmin }, async () => {
    const rates = await app.prisma.exchangeRate.findMany({
      include: { fromCurrency: true, toCurrency: true, updatedBy: true },
      orderBy: [{ fromCurrency: { sortOrder: 'asc' } }, { toCurrency: { sortOrder: 'asc' } }],
    });

    return rates.map((r) => ({
      id: r.id,
      pair: `${r.fromCurrency.code}/${r.toCurrency.code}`,
      fromCurrency: { id: r.fromCurrencyId, code: r.fromCurrency.code, name: r.fromCurrency.name },
      toCurrency: { id: r.toCurrencyId, code: r.toCurrency.code, name: r.toCurrency.name },
      rate: r.rate.toString(),
      feePercent: r.feePercent?.toString() ?? null,
      note: r.note,
      isActive: r.isActive,
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy ? r.updatedBy.firstName : null,
    }));
  });

  app.patch('/api/admin/rates/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const body = updateRateSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const updated = await app.prisma.exchangeRate.update({
      where: { id: params.data.id },
      data: {
        rate: body.data.rate,
        feePercent: body.data.feePercent === undefined ? undefined : body.data.feePercent,
        note: body.data.note === undefined ? undefined : body.data.note,
        isActive: body.data.isActive ?? undefined,
        updatedById: request.user.userId,
      },
      include: { fromCurrency: true, toCurrency: true },
    });

    audit(app, {
      actorId: request.user.userId,
      action: 'admin.rate_updated',
      entityType: 'ExchangeRate',
      entityId: updated.id,
      payload: {
        pair: `${updated.fromCurrency.code}/${updated.toCurrency.code}`,
        rate: updated.rate.toString(),
        feePercent: updated.feePercent?.toString() ?? null,
      },
    });

    return {
      id: updated.id,
      pair: `${updated.fromCurrency.code}/${updated.toCurrency.code}`,
      rate: updated.rate.toString(),
      feePercent: updated.feePercent?.toString() ?? null,
      note: updated.note,
      isActive: updated.isActive,
    };
  });

  // ── Content sections ────────────────────────────────────────────────────
  app.get('/api/admin/content', { preHandler: requireAdmin }, async () => {
    return app.prisma.contentSection.findMany({
      orderBy: [{ page: 'asc' }, { sortOrder: 'asc' }],
    });
  });

  app.patch('/api/admin/content/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const body = updateContentSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const updated = await app.prisma.contentSection.update({
      where: { id: params.data.id },
      data: {
        title: body.data.title,
        subtitle: body.data.subtitle,
        body: body.data.body,
        metadata: body.data.metadata !== undefined ? (body.data.metadata as object) : undefined,
        isPublished: body.data.isPublished,
      },
    });

    audit(app, {
      actorId: request.user.userId,
      action: 'admin.content_updated',
      entityType: 'ContentSection',
      entityId: updated.id,
      payload: { page: updated.page, key: updated.key },
    });

    return updated;
  });

  // ── FAQ ─────────────────────────────────────────────────────────────────
  app.get('/api/admin/faq', { preHandler: requireAdmin }, async () => {
    return app.prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } });
  });

  app.patch('/api/admin/faq/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const body = updateFaqSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const updated = await app.prisma.faqItem.update({
      where: { id: params.data.id },
      data: {
        question: body.data.question,
        answer: body.data.answer,
        sortOrder: body.data.sortOrder,
        isPublished: body.data.isPublished,
      },
    });

    audit(app, {
      actorId: request.user.userId,
      action: 'admin.faq_updated',
      entityType: 'FaqItem',
      entityId: updated.id,
    });

    return updated;
  });

  app.post('/api/admin/faq', { preHandler: requireAdmin }, async (request, reply) => {
    const body = updateFaqSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const created = await app.prisma.faqItem.create({
      data: {
        question: body.data.question,
        answer: body.data.answer,
        sortOrder: body.data.sortOrder ?? 99,
        isPublished: body.data.isPublished ?? true,
      },
    });

    audit(app, {
      actorId: request.user.userId,
      action: 'admin.faq_created',
      entityType: 'FaqItem',
      entityId: created.id,
    });

    return created;
  });

  app.delete('/api/admin/faq/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    await app.prisma.faqItem.delete({ where: { id: params.data.id } });

    audit(app, {
      actorId: request.user.userId,
      action: 'admin.faq_deleted',
      entityType: 'FaqItem',
      entityId: params.data.id,
    });

    return { ok: true };
  });

  // ── Users ───────────────────────────────────────────────────────────────
  app.get('/api/admin/users', { preHandler: requireAdmin }, async () => {
    return app.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        role: true,
        email: true,
        firstName: true,
        lastName: true,
        telegramUsername: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
        _count: { select: { exchangeRequests: true, chatThreads: true } },
      },
    });
  });

  // Block / unblock a user. isActive is enforced on login, /api/auth/me and the
  // socket handshake, so a blocked Telegram account cannot access anything —
  // and because the record is keyed by telegramId, the block persists across
  // re-logins (the same account maps to the same, still-blocked record).
  app.patch('/api/admin/users/:id/block', { preHandler: requireAdmin }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const body = z.object({ isActive: z.boolean() }).safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const target = await app.prisma.user.findUnique({
      where: { id: params.data.id },
      select: { id: true, role: true },
    });
    if (!target) {
      return reply.status(404).send({ error: 'Пользователь не найден' });
    }
    if (target.role === 'ADMIN') {
      return reply.status(403).send({ error: 'Нельзя заблокировать администратора' });
    }

    const updated = await app.prisma.user.update({
      where: { id: params.data.id },
      data: { isActive: body.data.isActive },
      select: { id: true, isActive: true },
    });

    audit(app, {
      actorId: request.user.userId,
      action: body.data.isActive ? 'admin.user_unblocked' : 'admin.user_blocked',
      entityType: 'User',
      entityId: updated.id,
    });

    return updated;
  });

  // ── Exchange Requests ───────────────────────────────────────────────────
  app.get('/api/admin/requests', { preHandler: requireAdmin }, async (request, reply) => {
    const query = requestsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'Неверный фильтр статуса' });
    }

    const requests = await app.prisma.exchangeRequest.findMany({
      where: query.data.status ? { status: query.data.status } : undefined,
      include: {
        sendCurrency: true,
        receiveCurrency: true,
        senderBank: true,
        receiverBank: true,
        user: { select: { id: true, firstName: true, telegramUsername: true } },
        chatThread: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return requests.map((r) => ({
      id: r.id,
      status: r.status,
      sendCurrency: r.sendCurrency.code,
      receiveCurrency: r.receiveCurrency.code,
      senderBank: r.senderBank.name,
      receiverBank: r.receiverBank.name,
      amount: r.amount.toString(),
      contact: r.contact,
      notes: r.notes,
      user: r.user,
      chatThreadId: r.chatThread?.id ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  });

  app.patch(
    '/api/admin/requests/:id/status',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const params = idParamsSchema.safeParse(request.params);
      const body = updateRequestStatusSchema.safeParse(request.body);
      if (!params.success || !body.success) {
        return reply.status(400).send({ error: 'Неверный статус' });
      }

      const updated = await app.prisma.exchangeRequest.update({
        where: { id: params.data.id },
        data: { status: body.data.status },
      });

      audit(app, {
        actorId: request.user.userId,
        action: 'admin.request_status_updated',
        entityType: 'ExchangeRequest',
        entityId: updated.id,
        payload: { status: updated.status },
      });

      return { id: updated.id, status: updated.status };
    },
  );

  // ── Chats ───────────────────────────────────────────────────────────────
  app.get('/api/admin/chats', { preHandler: requireAdmin }, async () => {
    const threads = await app.prisma.chatThread.findMany({
      include: {
        user: { select: { id: true, firstName: true, telegramUsername: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        exchangeRequest: { select: { id: true, status: true } },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      take: 500,
    });

    const unread = await attachUnreadForAdmin(app, threads);

    return threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      user: t.user,
      lastMessage: t.messages[0]?.body ?? null,
      lastMessageAt: t.lastMessageAt,
      exchangeRequest: t.exchangeRequest,
      unreadCount: unread.get(t.id) ?? 0,
    }));
  });

  app.get(
    '/api/admin/chats/:threadId/messages',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const params = threadParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: 'Неверный идентификатор чата' });
      }

      const thread = await app.prisma.chatThread.findUnique({
        where: { id: params.data.threadId },
        select: { id: true },
      });
      if (!thread) {
        return reply.status(404).send({ error: 'Чат не найден' });
      }

      // Opening the thread marks it read for the admin.
      await app.prisma.chatThread.update({
        where: { id: thread.id },
        data: { adminLastReadAt: new Date() },
      });

      return loadThreadMessages(app, thread.id);
    },
  );

  // Admin deletes a chat for everyone (hard delete, cascades messages).
  app.delete('/api/admin/chats/:threadId', { preHandler: requireAdmin }, async (request, reply) => {
    const params = threadParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Неверный идентификатор чата' });
    }
    await app.prisma.chatThread.delete({ where: { id: params.data.threadId } });
    audit(app, {
      actorId: request.user.userId,
      action: 'admin.chat_deleted',
      entityType: 'ChatThread',
      entityId: params.data.threadId,
    });
    return { ok: true };
  });

  // Admin deletes a single message for everyone (hard delete).
  app.delete(
    '/api/admin/chats/:threadId/messages/:messageId',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const params = z
        .object({ threadId: z.string().min(1).max(64), messageId: z.string().min(1).max(64) })
        .safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: 'Неверный запрос' });
      }
      const result = await app.prisma.chatMessage.deleteMany({
        where: { id: params.data.messageId, threadId: params.data.threadId },
      });
      if (result.count === 0) {
        return reply.status(404).send({ error: 'Сообщение не найдено' });
      }
      audit(app, {
        actorId: request.user.userId,
        action: 'admin.message_deleted',
        entityType: 'ChatMessage',
        entityId: params.data.messageId,
      });
      app.io.to(`thread:${params.data.threadId}`).emit('message_deleted', {
        threadId: params.data.threadId,
        messageId: params.data.messageId,
      });
      return { ok: true };
    },
  );

  app.post(
    '/api/admin/chats/:threadId/messages',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const params = threadParamsSchema.safeParse(request.params);
      const body = messageSchema.safeParse(request.body);
      if (!params.success || !body.success) {
        return reply.status(400).send({ error: 'Пустое или слишком длинное сообщение' });
      }

      const thread = await app.prisma.chatThread.findUnique({
        where: { id: params.data.threadId },
        select: { id: true },
      });
      if (!thread) {
        return reply.status(404).send({ error: 'Чат не найден' });
      }

      return createChatMessage(app, {
        threadId: thread.id,
        senderId: request.user.userId,
        senderRole: 'ADMIN',
        body: body.data.body,
        attachments: body.data.attachments,
      });
    },
  );

  app.get(
    '/api/admin/chats/:threadId/attachments/:token',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const params = z
        .object({ threadId: z.string().min(1).max(64), token: z.string().min(8).max(64) })
        .safeParse(request.params);
      if (!params.success) {
        return reply.status(400).send({ error: 'Неверный запрос' });
      }

      const thread = await app.prisma.chatThread.findUnique({
        where: { id: params.data.threadId },
        select: { id: true },
      });
      if (!thread) {
        return reply.status(404).send({ error: 'Чат не найден' });
      }

      return streamThreadAttachment(app, reply, params.data.threadId, params.data.token);
    },
  );
};

export default adminRoutes;
