import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../lib/auth-guard.js';

const createRequestSchema = z.object({
  sendCurrencyId: z.string().min(1),
  receiveCurrencyId: z.string().min(1),
  senderBankId: z.string().min(1),
  receiverBankId: z.string().min(1),
  amount: z.coerce.number().positive(),
  contact: z.string().min(1),
  notes: z.string().optional(),
});

const exchangeRequestRoutes: FastifyPluginAsync = async (app) => {
  app.post('/api/exchange-requests', async (request, reply) => {
    const body = createRequestSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Неверные данные формы', details: body.error.flatten() });
    }

    let userId: string | null = null;
    try {
      await request.jwtVerify();
      userId = request.user.userId;
    } catch {
      // Анонимная заявка — допускается
    }

    const exchangeRequest = await app.prisma.exchangeRequest.create({
      data: {
        userId,
        sendCurrencyId: body.data.sendCurrencyId,
        receiveCurrencyId: body.data.receiveCurrencyId,
        senderBankId: body.data.senderBankId,
        receiverBankId: body.data.receiverBankId,
        amount: body.data.amount,
        contact: body.data.contact,
        notes: body.data.notes ?? null,
        status: 'NEW',
      },
      include: {
        sendCurrency: true,
        receiveCurrency: true,
        senderBank: true,
        receiverBank: true,
      },
    });

    if (userId) {
      await app.prisma.chatThread.create({
        data: {
          userId,
          exchangeRequestId: exchangeRequest.id,
          subject: `Заявка: ${exchangeRequest.sendCurrency.code} → ${exchangeRequest.receiveCurrency.code}`,
        },
      });
    }

    return {
      id: exchangeRequest.id,
      status: exchangeRequest.status,
      sendCurrency: exchangeRequest.sendCurrency.code,
      receiveCurrency: exchangeRequest.receiveCurrency.code,
      senderBank: exchangeRequest.senderBank.name,
      receiverBank: exchangeRequest.receiverBank.name,
      amount: exchangeRequest.amount.toString(),
      contact: exchangeRequest.contact,
      createdAt: exchangeRequest.createdAt,
    };
  });

  app.get('/api/exchange-requests/my', { preHandler: requireAuth }, async (request) => {
    const requests = await app.prisma.exchangeRequest.findMany({
      where: { userId: request.user.userId },
      include: {
        sendCurrency: true,
        receiveCurrency: true,
        senderBank: true,
        receiverBank: true,
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
      chatThreadId: r.chatThread?.id ?? null,
      createdAt: r.createdAt,
    }));
  });
};

export default exchangeRequestRoutes;
