import { createMiddleware } from 'hono/factory';
import { createClerkClient } from '@clerk/backend';
import { env } from '@/config/env';
import { Errors } from '@/lib/errors';
import type { AuthContext } from '@/types/context';

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const authMiddleware = createMiddleware<AuthContext>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Errors.unauthorized('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    // Verify the session token with Clerk
    const payload = await clerk.verifyToken(token);

    if (!payload.sub) {
      throw Errors.unauthorized('Invalid token payload');
    }

    // Set user info on context
    c.set('userId', payload.sub);
    c.set('userEmail', (payload as Record<string, unknown>).email as string || '');

    await next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      throw Errors.unauthorized('Token expired');
    }
    throw Errors.unauthorized('Invalid token');
  }
});
