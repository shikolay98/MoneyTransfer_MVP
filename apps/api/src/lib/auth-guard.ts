import type { FastifyReply, FastifyRequest } from 'fastify';

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Forbidden' });
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
};
