import { z } from 'zod';

// Enums
const ageRangeEnum = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;
const genderEnum = ['male', 'female', 'other', 'prefer-not'] as const;
const heightRangeEnum = ['under-150', '150-165', '165-180', 'over-180', 'prefer-not'] as const;
const fitnessLevelEnum = ['sedentary', 'light', 'moderate', 'active'] as const;
const activityTypeEnum = ['walk', 'run'] as const;
const profileTypeEnum = ['rebuilder', 'starter', 'optimizer', 'guardian'] as const;

const healthBaselineSchema = z.object({
  avgDailySteps: z.number().int().nonnegative(),
  avgDailyDistanceKm: z.number().nonnegative(),
  totalWorkouts: z.number().int().nonnegative(),
  hasRunningWorkouts: z.boolean(),
});

const behaviorBreakdownSchema = z.object({
  unconsciousUsage: z.number().int().min(0).max(3),
  timeDisplacement: z.number().int().min(0).max(3),
  productivityImpact: z.number().int().min(0).max(3),
  failedRegulation: z.number().int().min(0).max(3),
});

export const generateGoalRequestSchema = z.object({
  ageRange: z.enum(ageRangeEnum),
  gender: z.enum(genderEnum),
  heightRange: z.enum(heightRangeEnum),
  fitnessLevel: z.enum(fitnessLevelEnum),
  behaviorScore: z.number().int().min(0).max(12),
  behaviorBreakdown: behaviorBreakdownSchema,
  activityType: z.enum(activityTypeEnum),
  healthBaseline: healthBaselineSchema.nullable(),
});

export const generateGoalResponseSchema = z.object({
  suggestedDistanceKm: z.number().min(0.5).max(15),
  suggestedRewardMinutes: z.number().int().min(5).max(200),
  reasoning: z.string(),
  profileType: z.enum(profileTypeEnum),
  profileTitle: z.string(),
  profileInsight: z.string(),
  successProbability: z.number().int().min(50).max(99),
  projectedGain: z.string(),
});

export type GenerateGoalRequest = z.infer<typeof generateGoalRequestSchema>;
export type GenerateGoalResponse = z.infer<typeof generateGoalResponseSchema>;
export type HealthBaseline = z.infer<typeof healthBaselineSchema>;
