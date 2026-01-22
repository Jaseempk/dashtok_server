import { serve } from '@hono/node-server';
import { app } from './app';
import { env } from '@/config/env';
import { initializeNotificationScheduler } from '@/modules/notifications/scheduler';

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
    console.log(`Environment: ${env.NODE_ENV}`);

    // Initialize notification cron jobs
    initializeNotificationScheduler();
  }
);

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
