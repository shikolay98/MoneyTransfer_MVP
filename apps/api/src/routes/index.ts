import type { FastifyInstance } from 'fastify';

import adminRoutes from './admin.js';
import authRoutes from './auth.js';
import chatRoutes from './chat.js';
import exchangeRequestRoutes from './exchange-requests.js';
import healthRoute from './health.js';
import publicRoutes from './public.js';

export const registerRoutes = async (app: FastifyInstance) => {
  await app.register(healthRoute);
  await app.register(publicRoutes);
  await app.register(authRoutes);
  await app.register(exchangeRequestRoutes);
  await app.register(chatRoutes);
  await app.register(adminRoutes);
};
