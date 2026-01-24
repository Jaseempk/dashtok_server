import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { success } from '@/lib/utils';
import { onboardingService } from './onboarding.service';
import { generateGoalRequestSchema } from './onboarding.schemas';
import type { AuthContext } from '@/types/context';

const router = new Hono<AuthContext>();

// All routes require authentication
router.use('*', authMiddleware);

// POST /onboarding/generate-goal
router.post('/generate-goal', validate.json(generateGoalRequestSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await onboardingService.generateGoal(data);
  return c.json(success(result));
});

export const onboardingRoutes = router;
