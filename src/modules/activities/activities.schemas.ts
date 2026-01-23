import { z } from 'zod';
import { activityTypeEnum, activitySourceEnum } from '@/db/schema';

export const createActivitySchema = z.object({
  activityType: z.enum(activityTypeEnum),
  distanceMeters: z.number().positive(),
  durationSeconds: z.number().int().positive(),
  steps: z.number().int().nonnegative().optional(),
  calories: z.number().int().nonnegative().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  source: z.enum(activitySourceEnum),
  healthkitId: z.string().optional(),

  // Anti-cheat: source metadata from HealthKit
  sourceBundleId: z.string().nullable().optional(),
  sourceDeviceModel: z.string().nullable().optional(),
  isManualEntry: z.boolean().optional(),
  routePointCount: z.number().int().nonnegative().optional(),
});

export const activityFiltersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  type: z.enum(activityTypeEnum).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().default(1),
});

export const activityIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type ActivityFilters = z.infer<typeof activityFiltersSchema>;
