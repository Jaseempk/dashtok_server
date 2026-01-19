export const APP_NAME = 'Dashtok';

export const ErrorCodes = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Activities
  DUPLICATE_ACTIVITY: 'DUPLICATE_ACTIVITY',
  INVALID_ACTIVITY: 'INVALID_ACTIVITY',

  // Goals
  GOAL_NOT_FOUND: 'GOAL_NOT_FOUND',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Activity validation
export const MAX_RUNNING_SPEED_KMH = 45; // Usain Bolt tops at ~44 km/h
export const MAX_WALKING_SPEED_KMH = 15;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Time
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
