import { relations } from 'drizzle-orm';
import { users } from './users';
import { activities } from './activities';
import { goals } from './goals';
import { allowances } from './allowances';
import { streaks } from './streaks';

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  activities: many(activities),
  goals: many(goals),
  allowances: many(allowances),
  streak: one(streaks),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const allowancesRelations = relations(allowances, ({ one }) => ({
  user: one(users, {
    fields: [allowances.userId],
    references: [users.id],
  }),
}));

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));

// Export all schemas
export { users, activities, goals, allowances, streaks };
export * from './users';
export * from './activities';
export * from './goals';
export * from './allowances';
export * from './streaks';
