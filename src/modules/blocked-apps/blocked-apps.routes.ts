import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { blockedAppsService } from './blocked-apps.service';
import { createBlockedAppsSchema, updateBlockedAppsSchema } from './blocked-apps.schemas';
import { success } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const blockedAppsRoutes = new Hono<AuthContext>();

// All routes require auth
blockedAppsRoutes.use('*', authMiddleware);

// GET /blocked-apps - Get user's blocked apps configuration
blockedAppsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const blockedApps = await blockedAppsService.getBlockedApps(userId);

  return c.json(success(blockedApps));
});

// POST /blocked-apps - Create or update blocked apps selection
blockedAppsRoutes.post('/', validate.json(createBlockedAppsSchema), async (c) => {
  const userId = c.get('userId');
  const input = c.req.valid('json');
  const blockedApps = await blockedAppsService.createOrUpdateBlockedApps(userId, input);

  return c.json(success(blockedApps), 201);
});

// PATCH /blocked-apps - Update enforcement toggle
blockedAppsRoutes.patch('/', validate.json(updateBlockedAppsSchema), async (c) => {
  const userId = c.get('userId');
  const input = c.req.valid('json');
  const blockedApps = await blockedAppsService.updateBlockedApps(userId, input);

  return c.json(success(blockedApps));
});

// DELETE /blocked-apps - Remove blocked apps configuration
blockedAppsRoutes.delete('/', async (c) => {
  const userId = c.get('userId');
  const result = await blockedAppsService.deleteBlockedApps(userId);

  return c.json(success(result));
});

// DELETE /blocked-apps/pending - Cancel pending changes
blockedAppsRoutes.delete('/pending', async (c) => {
  const userId = c.get('userId');
  const blockedApps = await blockedAppsService.cancelPendingChanges(userId);

  return c.json(success(blockedApps));
});

export { blockedAppsRoutes };
