import type { FastifyPluginAsync } from 'fastify';

const healthRoute: FastifyPluginAsync = async (app) => {
  // Liveness: the process is up.
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'moneytransfer-api',
      timestamp: new Date().toISOString(),
    };
  });

  // Readiness: the process can actually serve traffic (DB reachable).
  app.get('/health/ready', async (_request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch (error) {
      app.log.error({ err: error }, 'Readiness check failed');
      return reply.status(503).send({ status: 'unavailable' });
    }
  });
};

export default healthRoute;
