import { z } from 'zod';
import { goalTypeEnum, goalActivityTypeEnum, goalUnitEnum } from '@/db/schema';

export const createGoalSchema = z.object({
  goalType: z.enum(goalTypeEnum),
  activityType: z.enum(goalActivityTypeEnum),
  targetValue: z.number().positive(),
  targetUnit: z.enum(goalUnitEnum),
  rewardMinutes: z.number().int().positive().max(480), // Max 8 hours
});

export const updateGoalSchema = z.object({
  targetValue: z.number().positive().optional(),
  rewardMinutes: z.number().int().positive().max(480).optional(),
  isActive: z.boolean().optional(),
});

export const goalIdParamSchema = z.object({
  id: z.string().min(1),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
