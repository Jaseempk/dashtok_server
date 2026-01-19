import { z } from 'zod';

// Streaks don't have many input schemas since they're auto-calculated
// But we can have a schema for admin/testing purposes
export const resetStreakSchema = z.object({
  confirm: z.literal(true),
});

export type ResetStreakInput = z.infer<typeof resetStreakSchema>;
