import { ErrorCode, ErrorCodes } from '@/config/constants';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

// Pre-built error factories for common cases
export const Errors = {
  unauthorized: (message = 'Unauthorized') =>
    new AppError(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Forbidden') =>
    new AppError(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource: string) =>
    new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  alreadyExists: (resource: string) =>
    new AppError(ErrorCodes.ALREADY_EXISTS, `${resource} already exists`, 409),

  validation: (details: unknown) =>
    new AppError(ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, details),

  invalidActivity: (message: string) =>
    new AppError(ErrorCodes.INVALID_ACTIVITY, message, 400),

  duplicateActivity: () =>
    new AppError(ErrorCodes.DUPLICATE_ACTIVITY, 'Activity already recorded', 409),

  internal: (message = 'Internal server error') =>
    new AppError(ErrorCodes.INTERNAL_ERROR, message, 500),
} as const;
