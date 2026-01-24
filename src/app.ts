import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestLogger } from '@/middleware/logger';
import { errorHandler } from '@/middleware/error-handler';
import { env } from '@/config/env';

// Import routes
import { authRoutes } from '@/modules/auth/auth.routes';
import { usersRoutes } from '@/modules/users/users.routes';
import { goalsRoutes } from '@/modules/goals/goals.routes';
import { activitiesRoutes } from '@/modules/activities/activities.routes';
import { allowancesRoutes } from '@/modules/allowances/allowances.routes';
import { streaksRoutes } from '@/modules/streaks/streaks.routes';
import { blockedAppsRoutes } from '@/modules/blocked-apps/blocked-apps.routes';
import { usageRoutes } from '@/modules/usage/usage.routes';
import { enforcementRoutes } from '@/modules/enforcement/enforcement.routes';
import { onboardingRoutes } from '@/modules/onboarding/onboarding.routes';

const app = new Hono();

// Global middleware
app.use('*', requestLogger);
app.use(
  '*',
  cors({
    origin: env.NODE_ENV === 'production'
      ? ['https://your-app.com'] // Update with actual domains
      : ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
  })
);

// Global error handler
app.onError(errorHandler);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.route('/auth', authRoutes);
app.route('/users', usersRoutes);
app.route('/goals', goalsRoutes);
app.route('/activities', activitiesRoutes);
app.route('/allowances', allowancesRoutes);
app.route('/streaks', streaksRoutes);
app.route('/blocked-apps', blockedAppsRoutes);
app.route('/usage', usageRoutes);
app.route('/enforcement', enforcementRoutes);
app.route('/onboarding', onboardingRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

export { app };
