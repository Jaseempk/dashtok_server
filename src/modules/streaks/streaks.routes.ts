import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { streaksService } from './streaks.service';
import { success } from '@/lib/utils';
import type { AuthContext } from '@/types/context';

const streaksRoutes = new Hono<AuthContext>();

// All routes require auth
streaksRoutes.use('*', authMiddleware);

// GET /streaks - Get current user's streak
streaksRoutes.get('/', async (c) => {
  const userId = c.get('userId');

  // Check and potentially reset broken streaks
  await streaksService.checkAndResetBrokenStreaks(userId);

  const streak = await streaksService.getStreak(userId);
  return c.json(success(streak));
});

// POST /streaks/check - Force check and update streak
streaksRoutes.post('/check', async (c) => {
  const userId = c.get('userId');
  const streak = await streaksService.updateStreak(userId);
  return c.json(success(streak));
});

export { streaksRoutes };
