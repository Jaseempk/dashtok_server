import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
