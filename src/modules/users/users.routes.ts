import { Hono } from 'hono';
import { authMiddleware } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { usersService } from './users.service';
import { updateUserSchema } from './users.schemas';
import { success } from '@/lib/utils';
import { authService } from '@/modules/auth/auth.service';
import type { AuthContext } from '@/types/context';

const usersRoutes = new Hono<AuthContext>();

// All routes require auth
usersRoutes.use('*', authMiddleware);

// GET /users/me - Get current user profile
usersRoutes.get('/me', async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');

  // Ensure user exists (fallback if webhook missed)
  await authService.ensureUserExists(userId, userEmail);

  const user = await usersService.getProfile(userId);
  return c.json(success(user));
});

// PATCH /users/me - Update current user profile
usersRoutes.patch('/me', validate.json(updateUserSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const user = await usersService.updateProfile(userId, data);
  return c.json(success(user));
});

// DELETE /users/me - Delete current user account
usersRoutes.delete('/me', async (c) => {
  const userId = c.get('userId');
  await usersService.deleteAccount(userId);
  return c.json(success({ deleted: true }));
});

export { usersRoutes };
