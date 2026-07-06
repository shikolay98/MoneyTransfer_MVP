import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: 'USER' | 'ADMIN' };
    user: { userId: string; role: 'USER' | 'ADMIN' };
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_me',
    cookie: {
      cookieName: process.env.COOKIE_NAME ?? 'mt_session',
      signed: false,
    },
    sign: {
      expiresIn: '7d',
    },
  });
});
