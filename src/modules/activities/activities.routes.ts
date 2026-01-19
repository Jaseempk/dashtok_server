import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { activitiesService } from './activities.service';
import {
  createActivitySchema,
  activityFiltersSchema,
  activityIdParamSchema,
} from './activities.schemas';
import { success, paginated } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const activitiesRoutes = new Hono<AuthContext>();

// All routes require auth
activitiesRoutes.use('*', authMiddleware);

// GET /activities - List user's activities
activitiesRoutes.get('/', validate.query(activityFiltersSchema), async (c) => {
  const userId = c.get('userId');
  const filters = c.req.valid('query');
  const { data, total } = await activitiesService.getUserActivities(userId, filters);
  return c.json(paginated(data, total, filters.page, filters.limit));
});

// POST /activities - Record a new activity
activitiesRoutes.post('/', validate.json(createActivitySchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const activity = await activitiesService.createActivity(userId, data);
  return c.json(success(activity), 201);
});

// GET /activities/today - Get today's stats
activitiesRoutes.get('/today', async (c) => {
  const userId = c.get('userId');
  // TODO: Get timezone from user profile
  const stats = await activitiesService.getTodayStats(userId, 'UTC');
  return c.json(success(stats));
});

// GET /activities/:id - Get a single activity
activitiesRoutes.get('/:id', validate.param(activityIdParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const activity = await activitiesService.getActivity(userId, id);
  return c.json(success(activity));
});

// DELETE /activities/:id - Delete an activity
activitiesRoutes.delete('/:id', validate.param(activityIdParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  await activitiesService.deleteActivity(userId, id);
  return c.json(success({ deleted: true }));
});

export { activitiesRoutes };
