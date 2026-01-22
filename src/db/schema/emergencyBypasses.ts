import { pgTable, text, timestamp, integer, date, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

// Constants for bypass limits
export const EMERGENCY_BYPASS_LIMIT = 3; // Max bypasses per day
export const EMERGENCY_BYPASS_MINUTES = 5; // Minutes granted per bypass

export const emergencyBypasses = pgTable(
  'emergency_bypasses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(), // Date of bypass (for daily reset)
    bypassCount: integer('bypass_count').default(1).notNull(), // Times bypassed today (max 3)
    totalMinutes: integer('total_minutes').default(5).notNull(), // Total bypass minutes used today
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('emergency_bypasses_user_date_unique').on(table.userId, table.date), // One record per user per day
    index('emergency_bypasses_user_id_idx').on(table.userId),
    index('emergency_bypasses_date_idx').on(table.date),
  ]
);

export type EmergencyBypass = typeof emergencyBypasses.$inferSelect;
export type NewEmergencyBypass = typeof emergencyBypasses.$inferInsert;
