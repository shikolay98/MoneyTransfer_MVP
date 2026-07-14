import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server as SocketIOServer, type Socket } from 'socket.io';

import { corsOrigin, env } from '../config/env.js';

interface SocketIdentity {
  userId: string;
  role: 'USER' | 'ADMIN';
}

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

const identityOf = (socket: Socket): SocketIdentity | null =>
  (socket.data as { identity?: SocketIdentity }).identity ?? null;

export default fp(async (app: FastifyInstance) => {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    path: '/socket.io',
  });

  // Sockets are only used by authenticated areas (user chat, admin panel),
  // so connections without a valid session cookie are rejected outright.
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      next(new Error('Unauthorized'));
      return;
    }

    const token = app.parseCookie(cookieHeader)[env.COOKIE_NAME];
    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }

    let payload: SocketIdentity;
    try {
      payload = app.jwt.verify<SocketIdentity>(token);
    } catch {
      next(new Error('Unauthorized'));
      return;
    }

    // Re-check the account against the DB so a deactivated user cannot keep
    // a live socket until their JWT expires.
    app.prisma.user
      .findUnique({ where: { id: payload.userId }, select: { isActive: true } })
      .then((user) => {
        if (!user || !user.isActive) {
          next(new Error('Unauthorized'));
          return;
        }
        (socket.data as { identity?: SocketIdentity }).identity = {
          userId: payload.userId,
          role: payload.role,
        };
        next();
      })
      .catch(() => next(new Error('Unauthorized')));
  });

  io.on('connection', (socket) => {
    const identity = identityOf(socket);
    // Personal / role rooms power the live unread indicators.
    if (identity) {
      void socket.join(`user:${identity.userId}`);
      if (identity.role === 'ADMIN') {
        void socket.join('admins');
      }
    }

    socket.on('join_thread', async (threadId: unknown) => {
      const identity = identityOf(socket);
      if (!identity || typeof threadId !== 'string' || threadId.length > 64) {
        return;
      }

      if (identity.role !== 'ADMIN') {
        const thread = await app.prisma.chatThread.findUnique({
          where: { id: threadId },
          select: { userId: true },
        });

        if (!thread || thread.userId !== identity.userId) {
          socket.emit('thread_error', { threadId, error: 'Forbidden' });
          return;
        }
      }

      await socket.join(`thread:${threadId}`);
    });

    socket.on('leave_thread', (threadId: unknown) => {
      if (typeof threadId !== 'string' || threadId.length > 64) {
        return;
      }
      void socket.leave(`thread:${threadId}`);
    });
  });

  app.decorate('io', io);

  app.addHook('onClose', (instance, done) => {
    instance.io.close();
    done();
  });
});
