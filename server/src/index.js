import app from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { startReminderJob } from './jobs/reminders.js';

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      origin: env.CLIENT_ORIGIN,
    },
    `🚀 BookWise Local API Server running on port ${env.PORT}`
  );

  // Start background jobs
  startReminderJob();
});

// Graceful shutdown handling
function handleShutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed. Process terminating.');
    process.exit(0);
  });

  // Force close if stuck
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

