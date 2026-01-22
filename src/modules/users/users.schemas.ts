import { z } from 'zod';

// Expo push token format: ExponentPushToken[xxx] or ExpoPushToken[xxx]
const expoPushTokenRegex = /^Expo(nent)?PushToken\[.+\]$/;

// Time format: HH:MM (24-hour)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).optional(),
  onboardingCompleted: z.boolean().optional(),
  // Notification preferences
  notificationsEnabled: z.boolean().optional(),
  dailyReminderEnabled: z.boolean().optional(),
  dailyReminderTime: z
    .string()
    .regex(timeFormatRegex, 'Time must be in HH:MM format (24-hour)')
    .optional(),
  streakAlertsEnabled: z.boolean().optional(),
  weeklySummaryEnabled: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Push token registration schema
export const registerPushTokenSchema = z.object({
  token: z
    .string()
    .min(1)
    .regex(expoPushTokenRegex, 'Invalid Expo push token format'),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
