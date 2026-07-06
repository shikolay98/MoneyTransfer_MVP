import type { FastifyPluginAsync } from 'fastify';

import { getPublicBootstrap } from '../lib/public-bootstrap.js';

const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/public/bootstrap', async () => {
    return getPublicBootstrap(app.prisma);
  });
};

export default publicRoutes;
