'use strict';
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDatabase } = require('./config/database');

async function bootstrap() {
  await connectDatabase();
  const server = http.createServer(app);
  server.listen(env.port, () => logger.info(`ODOC running on ${env.baseUrl}`));

  const shutdown = (sig) => {
    logger.info(`${sig} received, shutting down`);
    server.close(() => process.exit(0));
  };
  ['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
}

bootstrap().catch((err) => {
  logger.error('Boot failed', err);
  process.exit(1);
});
