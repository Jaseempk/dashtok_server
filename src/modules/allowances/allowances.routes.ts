import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { allowancesService } from './allowances.service';
import { allowanceHistorySchema, updateUsedMinutesSchema } from './allowances.schemas';
import { success } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const allowancesRoutes = new Hono<AuthContext>();

// All routes require auth
allowancesRoutes.use('*', authMiddleware);

// GET /allowances/today - Get today's allowance
allowancesRoutes.get('/today', async (c) => {
  const userId = c.get('userId');
  // TODO: Get timezone from user profile
  const allowance = await allowancesService.getTodayAllowance(userId, 'UTC');
  const remaining = await allowancesService.getRemainingMinutes(userId, 'UTC');

  return c.json(
    success({
      ...allowance,
      remainingMinutes: remaining,
      totalMinutes: allowance.earnedMinutes + allowance.bonusMinutes,
    })
  );
});

// GET /allowances/history - Get allowance history
allowancesRoutes.get('/history', validate.query(allowanceHistorySchema), async (c) => {
  const userId = c.get('userId');
  const filters = c.req.valid('query');
  const history = await allowancesService.getHistory(userId, filters);
  return c.json(success(history));
});

// PATCH /allowances/today/used - Update used minutes (called by mobile app)
allowancesRoutes.patch(
  '/today/used',
  validate.json(updateUsedMinutesSchema),
  async (c) => {
    const userId = c.get('userId');
    const { usedMinutes } = c.req.valid('json');
    // TODO: Get timezone from user profile
    const allowance = await allowancesService.updateUsedMinutes(userId, usedMinutes, 'UTC');
    return c.json(success(allowance));
  }
);

// POST /allowances/recalculate - Force recalculate today's allowance
allowancesRoutes.post('/recalculate', async (c) => {
  const userId = c.get('userId');
  const allowance = await allowancesService.recalculateForToday(userId);
  return c.json(success(allowance));
});

export { allowancesRoutes };
