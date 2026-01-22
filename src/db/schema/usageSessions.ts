import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { allowances } from './allowances';

// Source of usage session - how it was triggered
export const usageSessionSource = {
  THRESHOLD_EVENT: 'threshold_event', // iOS hit the time limit
  APP_FOREGROUND: 'app_foreground', // Dashtok app came to foreground, reconciled state
  MANUAL_MARK: 'manual_mark', // User manually ended session
} as const;

export type UsageSessionSource = typeof usageSessionSource[keyof typeof usageSessionSource];

export const usageSessions = pgTable(
  'usage_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    allowanceId: text('allowance_id')
      .references(() => allowances.id, { onDelete: 'set null' }), // Links to which day's allowance
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }), // NULL if session ongoing
    durationSeconds: integer('duration_seconds'), // Calculated on end (server-side only)
    source: text('source').notNull(), // 'threshold_event' | 'app_foreground' | 'manual_mark'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('usage_sessions_user_id_idx').on(table.userId),
    index('usage_sessions_allowance_id_idx').on(table.allowanceId),
    index('usage_sessions_started_at_idx').on(table.startedAt),
  ]
);

export type UsageSession = typeof usageSessions.$inferSelect;
export type NewUsageSession = typeof usageSessions.$inferInsert;
