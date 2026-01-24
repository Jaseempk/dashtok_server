import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  name: text('name'),
  timezone: text('timezone').default('UTC').notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),

  // Push notification fields
  pushToken: text('push_token'), // Expo push token (ExponentPushToken[xxx])
  notificationsEnabled: boolean('notifications_enabled').default(false).notNull(),
  dailyReminderEnabled: boolean('daily_reminder_enabled').default(true).notNull(),
  dailyReminderTime: text('daily_reminder_time').default('08:00').notNull(), // HH:MM format
  streakAlertsEnabled: boolean('streak_alerts_enabled').default(true).notNull(),
  weeklySummaryEnabled: boolean('weekly_summary_enabled').default(false).notNull(),

  // Onboarding demographics
  ageRange: text('age_range', { enum: ['18-24', '25-34', '35-44', '45-54', '55+'] }),
  gender: text('gender', { enum: ['male', 'female', 'other', 'prefer-not'] }),
  heightRange: text('height_range', { enum: ['under-150', '150-165', '165-180', 'over-180', 'prefer-not'] }),

  // Behavior assessment
  initialBehaviorScore: integer('initial_behavior_score'), // 0-12
  profileType: text('profile_type', { enum: ['rebuilder', 'starter', 'optimizer', 'guardian'] }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
