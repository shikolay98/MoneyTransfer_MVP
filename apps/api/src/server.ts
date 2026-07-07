import 'dotenv/config';

import { buildApp } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const app = await buildApp();

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info(`Received ${signal}, shutting down gracefully`);
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error(error, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', (signal) => void shutdown(signal));
  process.on('SIGINT', (signal) => void shutdown(signal));

  try {
    await app.listen({
      host: '0.0.0.0',
      port: env.PORT,
    });

    app.log.info(`API is running at ${env.API_URL}`);
  } catch (error) {
    app.log.error(error, 'Failed to start API');
    process.exit(1);
  }
};

void start();
