import type { ErrorHandler } from 'hono';
import { AppError } from '@/lib/errors';
import { ErrorCodes } from '@/config/constants';
import { env } from '@/config/env';

export const errorHandler: ErrorHandler = (err, c) => {
  // Log error (but not sensitive data)
  console.error(`[Error] ${err.message}`, {
    code: err instanceof AppError ? err.code : 'UNKNOWN',
    path: c.req.path,
    method: c.req.method,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  // Handle known AppErrors
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: err.toJSON(),
      },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    );
  }

  // Handle unknown errors
  return c.json(
    {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
      },
    },
    500
  );
};
