import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAdmin } from '../lib/auth-guard.js';

const updateRateSchema = z.object({
  rate: z.coerce.number().positive(),
  feePercent: z.coerce.number().min(0).max(100).optional(),
  note: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  metadata: z.unknown().optional(),
  isPublished: z.boolean().optional(),
});

const updateFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const updateRequestStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
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
    const { id } = request.params as { id: string };
    const body = updateRateSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const updated = await app.prisma.exchangeRate.update({
      where: { id },
      data: {
        rate: body.data.rate,
        feePercent: body.data.feePercent ?? undefined,
        note: body.data.note ?? undefined,
        isActive: body.data.isActive ?? undefined,
        updatedById: request.user.userId,
      },
      include: { fromCurrency: true, toCurrency: true },
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
    const sections = await app.prisma.contentSection.findMany({
      orderBy: [{ page: 'asc' }, { sortOrder: 'asc' }],
    });
    return sections;
  });

  app.patch('/api/admin/content/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateContentSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    const updated = await app.prisma.contentSection.update({
      where: { id },
      data: {
        title: body.data.title,
        subtitle: body.data.subtitle,
        body: body.data.body,
        metadata: body.data.metadata !== undefined ? (body.data.metadata as object) : undefined,
        isPublished: body.data.isPublished,
      },
    });

    return updated;
  });

  // ── FAQ ─────────────────────────────────────────────────────────────────
  app.get('/api/admin/faq', { preHandler: requireAdmin }, async () => {
    return app.prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } });
  });

  app.patch('/api/admin/faq/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateFaqSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    return app.prisma.faqItem.update({
      where: { id },
      data: {
        question: body.data.question,
        answer: body.data.answer,
        sortOrder: body.data.sortOrder,
        isPublished: body.data.isPublished,
      },
    });
  });

  app.post('/api/admin/faq', { preHandler: requireAdmin }, async (request, reply) => {
    const body = updateFaqSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные' });
    }

    return app.prisma.faqItem.create({
      data: {
        question: body.data.question,
        answer: body.data.answer,
        sortOrder: body.data.sortOrder ?? 99,
        isPublished: body.data.isPublished ?? true,
      },
    });
  });

  app.delete('/api/admin/faq/:id', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    await app.prisma.faqItem.delete({ where: { id } });
    return { ok: true };
  });

  // ── Users ───────────────────────────────────────────────────────────────
  app.get('/api/admin/users', { preHandler: requireAdmin }, async () => {
    const users = await app.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
    return users;
  });

  // ── Exchange Requests ───────────────────────────────────────────────────
  app.get('/api/admin/requests', { preHandler: requireAdmin }, async (request) => {
    const { status } = request.query as { status?: string };

    const requests = await app.prisma.exchangeRequest.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        sendCurrency: true,
        receiveCurrency: true,
        senderBank: true,
        receiverBank: true,
        user: { select: { id: true, firstName: true, telegramUsername: true } },
        chatThread: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
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

  app.patch('/api/admin/requests/:id/status', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateRequestStatusSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверный статус' });
    }

    const updated = await app.prisma.exchangeRequest.update({
      where: { id },
      data: { status: body.data.status },
    });

    return { id: updated.id, status: updated.status };
  });

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
    });

    return threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      user: t.user,
      lastMessage: t.messages[0]?.body ?? null,
      lastMessageAt: t.lastMessageAt,
      exchangeRequest: t.exchangeRequest,
    }));
  });

  app.get('/api/admin/chats/:threadId/messages', { preHandler: requireAdmin }, async (request) => {
    const { threadId } = request.params as { threadId: string };

    const messages = await app.prisma.chatMessage.findMany({
      where: { threadId },
      include: { sender: { select: { id: true, firstName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  });

  app.post('/api/admin/chats/:threadId/messages', { preHandler: requireAdmin }, async (request, reply) => {
    const { threadId } = request.params as { threadId: string };
    const body = z.object({ body: z.string().min(1) }).safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Пустое сообщение' });
    }

    const message = await app.prisma.chatMessage.create({
      data: {
        threadId,
        senderId: request.user.userId,
        senderRole: 'ADMIN',
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
};

export default adminRoutes;
