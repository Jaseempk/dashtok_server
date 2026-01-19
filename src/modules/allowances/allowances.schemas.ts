import { z } from 'zod';

export const allowanceHistorySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export const updateUsedMinutesSchema = z.object({
  usedMinutes: z.number().int().nonnegative(),
});

export type AllowanceHistoryFilters = z.infer<typeof allowanceHistorySchema>;
export type UpdateUsedMinutesInput = z.infer<typeof updateUsedMinutesSchema>;
