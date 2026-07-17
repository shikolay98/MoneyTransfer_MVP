import { createReadStream } from 'node:fs';

import type { FastifyInstance, FastifyReply } from 'fastify';
import { Prisma, type ChatParticipantRole } from '@prisma/client';

import {
  ALLOWED_MIME,
  attachmentExists,
  attachmentPath,
  findAttachment,
  type AttachmentMeta,
} from './attachments.js';

export const MAX_MESSAGE_LENGTH = 4000;
export const MESSAGES_PAGE_SIZE = 500;

const moneyFormatter = (maxFrac: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: maxFrac, useGrouping: true });

// "10 000" / "4 563" / "10 000,5" — spaces group thousands, comma for decimals.
const formatMoney = (value: number, maxFrac = 2): string =>
  Number.isFinite(value) ? moneyFormatter(maxFrac).format(value) : '';

type RateInfo = { rate: number; feePercent: number };

// Loads active rates keyed by "fromId:toId" so a chat list can estimate the
// receive amount without a per-thread query.
export const loadRateMap = async (app: FastifyInstance): Promise<Map<string, RateInfo>> => {
  const rates = await app.prisma.exchangeRate.findMany({
    where: { isActive: true },
    select: { fromCurrencyId: true, toCurrencyId: true, rate: true, feePercent: true },
  });
  return new Map(
    rates.map((r) => [
      `${r.fromCurrencyId}:${r.toCurrencyId}`,
      { rate: Number(r.rate), feePercent: r.feePercent ? Number(r.feePercent) : 0 },
    ]),
  );
};

type RequestForTitle = {
  amount: Prisma.Decimal | number | string;
  sendCurrencyId: string;
  receiveCurrencyId: string;
  sendCurrency: { code: string };
  receiveCurrency: { code: string };
};

// Builds a human, self-distinguishing chat title from the linked request, e.g.
// "RUB 10 000 → UAH 4 563". Falls back to just the send side when no rate is
// available. The receive amount is an estimate (the manager confirms the final).
export const buildRequestChatTitle = (
  req: RequestForTitle,
  rateMap: Map<string, RateInfo>,
): string => {
  const sendAmount = Number(req.amount);
  const sendPart = `${req.sendCurrency.code} ${formatMoney(sendAmount)}`;
  const rate = rateMap.get(`${req.sendCurrencyId}:${req.receiveCurrencyId}`);
  if (!rate || !Number.isFinite(sendAmount)) {
    return `${sendPart} → ${req.receiveCurrency.code}`;
  }
  const receive = sendAmount * rate.rate * (1 - rate.feePercent / 100);
  return `${sendPart} → ${req.receiveCurrency.code} ${formatMoney(receive, 0)}`;
};

export const loadThreadMessages = async (
  app: FastifyInstance,
  threadId: string,
  forUser = false,
) => {
  // Last N messages in chronological order. For the user side we skip messages
  // they deleted "for me"; the admin always sees everything.
  const messages = await app.prisma.chatMessage.findMany({
    where: { threadId, ...(forUser ? { hiddenForUser: false } : {}) },
    include: { sender: { select: { id: true, firstName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: MESSAGES_PAGE_SIZE,
  });

  return messages.reverse();
};

export const createChatMessage = async (
  app: FastifyInstance,
  params: {
    threadId: string;
    senderId: string | null;
    senderRole: ChatParticipantRole;
    body: string;
    attachments?: AttachmentMeta[];
  },
) => {
  const attachments = params.attachments?.length
    ? (params.attachments as unknown as Prisma.InputJsonValue)
    : undefined;

  const [message, thread] = await app.prisma.$transaction([
    app.prisma.chatMessage.create({
      data: {
        threadId: params.threadId,
        senderId: params.senderId,
        senderRole: params.senderRole,
        body: params.body,
        attachments,
        status: 'SENT',
      },
      include: { sender: { select: { id: true, firstName: true, role: true } } },
    }),
    app.prisma.chatThread.update({
      where: { id: params.threadId },
      data: { lastMessageAt: new Date() },
      select: { userId: true },
    }),
  ]);

  app.io.to(`thread:${params.threadId}`).emit('new_message', message);

  // Live unread indicator: ping the audience that did NOT send this message.
  if (params.senderRole === 'USER') {
    app.io.to('admins').emit('unread_ping', { scope: 'admin' });
  } else {
    app.io.to(`user:${thread.userId}`).emit('unread_ping', { scope: 'user', threadId: params.threadId });
  }

  return message;
};

// Counts unread messages per thread for one side (user or admin), based on the
// per-side read markers.
export const attachUnreadForUser = async (
  app: FastifyInstance,
  threads: { id: string; userLastReadAt: Date | null }[],
): Promise<Map<string, number>> => {
  const entries = await Promise.all(
    threads.map(async (t) => {
      const count = await app.prisma.chatMessage.count({
        where: {
          threadId: t.id,
          hiddenForUser: false,
          senderRole: { in: ['ADMIN', 'SYSTEM'] },
          ...(t.userLastReadAt ? { createdAt: { gt: t.userLastReadAt } } : {}),
        },
      });
      return [t.id, count] as const;
    }),
  );
  return new Map(entries);
};

export const attachUnreadForAdmin = async (
  app: FastifyInstance,
  threads: { id: string; adminLastReadAt: Date | null }[],
): Promise<Map<string, number>> => {
  const entries = await Promise.all(
    threads.map(async (t) => {
      const count = await app.prisma.chatMessage.count({
        where: {
          threadId: t.id,
          senderRole: 'USER',
          ...(t.adminLastReadAt ? { createdAt: { gt: t.adminLastReadAt } } : {}),
        },
      });
      return [t.id, count] as const;
    }),
  );
  return new Map(entries);
};

// Streams an attachment that belongs to a message in the given thread.
// The caller must have already verified access to the thread.
export const streamThreadAttachment = async (
  app: FastifyInstance,
  reply: FastifyReply,
  threadId: string,
  token: string,
) => {
  const rows = await app.prisma.chatMessage.findMany({
    where: { threadId, attachments: { not: Prisma.JsonNull } },
    select: { attachments: true },
    take: MESSAGES_PAGE_SIZE,
  });

  let meta: AttachmentMeta | null = null;
  for (const row of rows) {
    meta = findAttachment(row.attachments, token);
    if (meta) break;
  }

  if (!meta || !ALLOWED_MIME[meta.mime] || !attachmentExists(token)) {
    return reply.status(404).send({ error: 'Вложение не найдено' });
  }

  const path = attachmentPath(token);
  if (!path) {
    return reply.status(404).send({ error: 'Вложение не найдено' });
  }

  reply.header('Content-Type', meta.mime);
  reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(meta.name)}"`);
  reply.header('Cache-Control', 'private, max-age=86400');
  return reply.send(createReadStream(path));
};
