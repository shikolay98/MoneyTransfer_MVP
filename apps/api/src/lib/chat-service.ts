import type { FastifyInstance } from 'fastify';
import type { ChatParticipantRole } from '@prisma/client';

export const MAX_MESSAGE_LENGTH = 4000;
export const MESSAGES_PAGE_SIZE = 500;

export const loadThreadMessages = async (app: FastifyInstance, threadId: string) => {
  // Last N messages in chronological order.
  const messages = await app.prisma.chatMessage.findMany({
    where: { threadId },
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
  },
) => {
  const [message] = await app.prisma.$transaction([
    app.prisma.chatMessage.create({
      data: {
        threadId: params.threadId,
        senderId: params.senderId,
        senderRole: params.senderRole,
        body: params.body,
        status: 'SENT',
      },
      include: { sender: { select: { id: true, firstName: true, role: true } } },
    }),
    app.prisma.chatThread.update({
      where: { id: params.threadId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  app.io.to(`thread:${params.threadId}`).emit('new_message', message);

  return message;
};
