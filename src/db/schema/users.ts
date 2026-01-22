import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

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

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
