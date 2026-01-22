import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { usageService } from './usage.service';
import { usersRepository } from '../users/users.repository';
import { startSessionSchema, endSessionSchema } from './usage.schemas';
import { success } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const usageRoutes = new Hono<AuthContext>();

// All routes require auth
usageRoutes.use('*', authMiddleware);

// Helper to get user's timezone
async function getUserTimezone(userId: string): Promise<string> {
  const user = await usersRepository.findById(userId);
  return user?.timezone ?? 'UTC';
}

// POST /usage/session/start - Start a usage session
usageRoutes.post('/session/start', validate.json(startSessionSchema), async (c) => {
  const userId = c.get('userId');
  const input = c.req.valid('json');
  const timezone = await getUserTimezone(userId);
  const result = await usageService.startSession(userId, input, timezone);

  return c.json(success(result), 201);
});

// POST /usage/session/end - End a usage session
usageRoutes.post('/session/end', validate.json(endSessionSchema), async (c) => {
  const userId = c.get('userId');
  const input = c.req.valid('json');
  const timezone = await getUserTimezone(userId);
  const result = await usageService.endSession(userId, input, timezone);

  return c.json(success(result));
});

// GET /usage/today - Get today's usage summary
usageRoutes.get('/today', async (c) => {
  const userId = c.get('userId');
  const timezone = await getUserTimezone(userId);
  const result = await usageService.getTodayUsage(userId, timezone);

  return c.json(success(result));
});

export { usageRoutes };
