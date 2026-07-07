import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { env } from '../config/env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: 'USER' | 'ADMIN' };
    user: { userId: string; role: 'USER' | 'ADMIN' };
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: env.COOKIE_NAME,
      signed: false,
    },
    sign: {
      expiresIn: `${env.SESSION_TTL_HOURS}h`,
    },
  });
});
