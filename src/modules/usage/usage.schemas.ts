import { z } from 'zod';
import { usageSessionSource } from '@/db/schema/usageSessions';

// Schema for starting a usage session
export const startSessionSchema = z.object({
  source: z.enum([
    usageSessionSource.THRESHOLD_EVENT,
    usageSessionSource.APP_FOREGROUND,
    usageSessionSource.MANUAL_MARK,
  ]).default(usageSessionSource.APP_FOREGROUND),
  /** Idempotency key for offline queue deduplication */
  idempotencyKey: z.string().optional(),
});

// Schema for ending a usage session
export const endSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  /** Idempotency key for offline queue deduplication */
  idempotencyKey: z.string().optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
