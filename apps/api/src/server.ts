import 'dotenv/config';

import { buildApp } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const app = await buildApp();

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
