import { pgTable, text, timestamp, integer, real, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const streaks = pgTable('streaks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastCompletedDate: date('last_completed_date'),
  multiplier: real('multiplier').default(1.0).notNull(), // Bonus multiplier for long streaks
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
