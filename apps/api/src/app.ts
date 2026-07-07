import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { Prisma } from '@prisma/client';
import Fastify, { type FastifyError } from 'fastify';

import { corsOrigins, env } from './config/env.js';
import { ensureUploadDir, MAX_UPLOAD_BYTES } from './lib/attachments.js';
import jwtPlugin from './plugins/jwt.js';
import prismaPlugin from './plugins/prisma.js';
import socketIoPlugin from './plugins/socket-io.js';
import { registerRoutes } from './routes/index.js';

export const buildApp = async () => {
  const app = Fastify({
    trustProxy: env.TRUST_PROXY,
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  });

  await app.register(helmet, {
    // The API serves JSON only; a CSP would only affect error pages.
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Слишком много запросов. Попробуйте позже.',
    }),
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: 'onRequest',
  });

  await app.register(multipart, {
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
    },
  });

  await ensureUploadDir();

  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(socketIoPlugin);
  await registerRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Запись не найдена' });
      }
      if (error.code === 'P2003') {
        return reply.status(400).send({ error: 'Неверная ссылка на связанную запись' });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Такая запись уже существует' });
      }
    }

    const fastifyError = error as FastifyError;
    const statusCode =
      typeof fastifyError.statusCode === 'number' && fastifyError.statusCode >= 400
        ? fastifyError.statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled error');
      // Never leak internals to the client.
      return reply.status(500).send({ error: 'Внутренняя ошибка сервера' });
    }

    return reply.status(statusCode).send({ error: fastifyError.message });
  });

  return app;
};
