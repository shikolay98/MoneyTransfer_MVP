import type { FastifyPluginAsync } from 'fastify';

const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'moneytransfer-api',
      timestamp: new Date().toISOString(),
    };
  });
};

export default healthRoute;
