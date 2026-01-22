import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { enforcementService } from './enforcement.service';
import { usersRepository } from '../users/users.repository';
import { success } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const enforcementRoutes = new Hono<AuthContext>();

// All routes require auth
enforcementRoutes.use('*', authMiddleware);

// Helper to get user's timezone
async function getUserTimezone(userId: string): Promise<string> {
  const user = await usersRepository.findById(userId);
  return user?.timezone ?? 'UTC';
}

// GET /enforcement/status - Get current enforcement state
enforcementRoutes.get('/status', async (c) => {
  const userId = c.get('userId');
  const timezone = await getUserTimezone(userId);
  const status = await enforcementService.getStatus(userId, timezone);

  return c.json(success(status));
});

// POST /enforcement/unlock - Request to unlock apps
enforcementRoutes.post('/unlock', async (c) => {
  const userId = c.get('userId');
  const timezone = await getUserTimezone(userId);
  const result = await enforcementService.requestUnlock(userId, timezone);

  return c.json(success(result));
});

// POST /enforcement/lock - Request to lock apps
enforcementRoutes.post('/lock', async (c) => {
  const userId = c.get('userId');
  const timezone = await getUserTimezone(userId);
  const result = await enforcementService.requestLock(userId, timezone);

  return c.json(success(result));
});

// POST /enforcement/emergency-bypass - Request emergency bypass (rate limited)
enforcementRoutes.post('/emergency-bypass', async (c) => {
  const userId = c.get('userId');
  const timezone = await getUserTimezone(userId);
  const result = await enforcementService.requestEmergencyBypass(userId, timezone);

  return c.json(success(result));
});

export { enforcementRoutes };
