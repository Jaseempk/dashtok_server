import { logger } from 'hono/logger';

// Re-export Hono's built-in logger
export const requestLogger = logger();
