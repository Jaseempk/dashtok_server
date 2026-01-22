import { z } from 'zod';

// Schema for creating/updating blocked apps selection
export const createBlockedAppsSchema = z.object({
  selectionData: z.string().min(1, 'Selection data is required'),
  selectionId: z.string().min(1, 'Selection ID is required'),
  appCount: z.number().int().nonnegative().default(0),
  categoryCount: z.number().int().nonnegative().default(0),
});

// Schema for updating enforcement toggle
export const updateBlockedAppsSchema = z.object({
  isActive: z.boolean(),
});

export type CreateBlockedAppsInput = z.infer<typeof createBlockedAppsSchema>;
export type UpdateBlockedAppsInput = z.infer<typeof updateBlockedAppsSchema>;
