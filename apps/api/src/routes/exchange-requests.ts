import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../lib/auth-guard.js';

const MAX_AMOUNT = 100_000_000;

const createRequestSchema = z.object({
  sendCurrencyId: z.string().min(1).max(64),
  receiveCurrencyId: z.string().min(1).max(64),
  senderBankId: z.string().min(1).max(64),
  receiverBankId: z.string().min(1).max(64),
  amount: z.coerce.number().positive().max(MAX_AMOUNT),
  contact: z.string().min(3).max(200),
  notes: z.string().max(2000).optional(),
});

const exchangeRequestRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/api/exchange-requests',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = createRequestSchema.safeParse(request.body);
      if (!body.success) {
        return reply
          .status(400)
          .send({ error: 'Неверные данные формы', details: body.error.flatten() });
      }

      if (body.data.sendCurrencyId === body.data.receiveCurrencyId) {
        return reply.status(400).send({ error: 'Выберите разные валюты отправки и получения' });
      }

      let userId: string | null = null;
      try {
        await request.jwtVerify();
        userId = request.user.userId;
      } catch {
        // Анонимная заявка — допускается
      }

      const [sendCurrency, receiveCurrency, senderBank, receiverBank] = await Promise.all([
        app.prisma.currency.findFirst({
          where: { id: body.data.sendCurrencyId, isActive: true },
        }),
        app.prisma.currency.findFirst({
          where: { id: body.data.receiveCurrencyId, isActive: true },
        }),
        app.prisma.bank.findFirst({ where: { id: body.data.senderBankId, isActive: true } }),
        app.prisma.bank.findFirst({ where: { id: body.data.receiverBankId, isActive: true } }),
      ]);

      if (!sendCurrency || !receiveCurrency || !senderBank || !receiverBank) {
        return reply.status(400).send({ error: 'Выбранная валюта или банк недоступны' });
      }

      const exchangeRequest = await app.prisma.$transaction(async (tx) => {
        const created = await tx.exchangeRequest.create({
          data: {
            userId,
            sendCurrencyId: sendCurrency.id,
            receiveCurrencyId: receiveCurrency.id,
            senderBankId: senderBank.id,
            receiverBankId: receiverBank.id,
            amount: body.data.amount,
            contact: body.data.contact,
            notes: body.data.notes ?? null,
            status: 'NEW',
          },
        });

        if (userId) {
          await tx.chatThread.create({
            data: {
              userId,
              exchangeRequestId: created.id,
              subject: `Заявка: ${sendCurrency.code} → ${receiveCurrency.code}`,
              lastMessageAt: new Date(),
              messages: {
                create: {
                  senderRole: 'SYSTEM',
                  body: `Заявка на обмен ${sendCurrency.code} → ${receiveCurrency.code} на сумму ${body.data.amount} создана. Менеджер скоро подключится к чату.`,
                },
              },
            },
          });
        }

        return created;
      });

      return {
        id: exchangeRequest.id,
        status: exchangeRequest.status,
        sendCurrency: sendCurrency.code,
        receiveCurrency: receiveCurrency.code,
        senderBank: senderBank.name,
        receiverBank: receiverBank.name,
        amount: exchangeRequest.amount.toString(),
        contact: exchangeRequest.contact,
        createdAt: exchangeRequest.createdAt,
      };
    },
  );

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
      take: 100,
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
