import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { goalsService } from './goals.service';
import { createGoalSchema, updateGoalSchema, goalIdParamSchema } from './goals.schemas';
import { success } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const goalsRoutes = new Hono<AuthContext>();

// All routes require auth
goalsRoutes.use('*', authMiddleware);

// GET /goals - List user's goals
goalsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const activeOnly = c.req.query('active') === 'true';
  const goals = await goalsService.getUserGoals(userId, activeOnly);
  return c.json(success(goals));
});

// POST /goals - Create a new goal
goalsRoutes.post('/', validate.json(createGoalSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const goal = await goalsService.createGoal(userId, data);
  return c.json(success(goal), 201);
});

// GET /goals/:id - Get a single goal
goalsRoutes.get('/:id', validate.param(goalIdParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const goal = await goalsService.getGoal(userId, id);
  return c.json(success(goal));
});

// PATCH /goals/:id - Update a goal
goalsRoutes.patch(
  '/:id',
  validate.param(goalIdParamSchema),
  validate.json(updateGoalSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const goal = await goalsService.updateGoal(userId, id, data);
    return c.json(success(goal));
  }
);

// DELETE /goals/:id - Delete a goal
goalsRoutes.delete('/:id', validate.param(goalIdParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  await goalsService.deleteGoal(userId, id);
  return c.json(success({ deleted: true }));
});

export { goalsRoutes };
