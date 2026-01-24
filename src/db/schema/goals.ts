import { pgTable, text, timestamp, real, integer, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const goalTypeEnum = ['daily', 'weekly'] as const;
export type GoalType = (typeof goalTypeEnum)[number];

export const goalActivityTypeEnum = ['run', 'walk', 'any'] as const;
export type GoalActivityType = (typeof goalActivityTypeEnum)[number];

export const goalUnitEnum = ['km', 'miles', 'steps'] as const;
export type GoalUnit = (typeof goalUnitEnum)[number];

export const goals = pgTable(
  'goals',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalType: text('goal_type', { enum: goalTypeEnum }).notNull(),
    activityType: text('activity_type', { enum: goalActivityTypeEnum }).notNull(),
    targetValue: real('target_value').notNull(), // e.g., 2.0 for 2km
    targetUnit: text('target_unit', { enum: goalUnitEnum }).notNull(),
    rewardMinutes: integer('reward_minutes').notNull(), // Screen time earned
    isActive: boolean('is_active').default(true).notNull(),

    // LLM suggestion tracking (analytics)
    suggestedValue: real('suggested_value'),
    userAdjusted: boolean('user_adjusted').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('goals_user_id_idx').on(table.userId),
    index('goals_user_active_idx').on(table.userId, table.isActive),
  ]
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
