import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server as SocketIOServer } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}

export default fp(async (app: FastifyInstance) => {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    socket.on('join_thread', (threadId: string) => {
      void socket.join(`thread:${threadId}`);
    });

    socket.on('leave_thread', (threadId: string) => {
      void socket.leave(`thread:${threadId}`);
    });
  });

  app.decorate('io', io);

  app.addHook('onClose', (instance, done) => {
    instance.io.close();
    done();
  });
});
