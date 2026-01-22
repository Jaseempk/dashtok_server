import { pgTable, text, timestamp, integer, boolean, date, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const allowances = pgTable(
  'allowances',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(), // The day this allowance is for
    earnedMinutes: integer('earned_minutes').default(0).notNull(),
    usedMinutes: integer('used_minutes').default(0).notNull(),
    bonusMinutes: integer('bonus_minutes').default(0).notNull(), // From streaks, achievements
    isUnlocked: boolean('is_unlocked').default(false).notNull(),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
    // Screen time enforcement fields
    realUsedMinutes: integer('real_used_minutes').default(0).notNull(), // From actual iOS tracking (not self-reported)
    enforcementActive: boolean('enforcement_active').default(true).notNull(), // Whether enforcement is enabled for this day
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('allowances_user_id_idx').on(table.userId),
    index('allowances_date_idx').on(table.date),
    unique('allowances_user_date_unique').on(table.userId, table.date),
  ]
);

export type Allowance = typeof allowances.$inferSelect;
export type NewAllowance = typeof allowances.$inferInsert;
