import { relations } from 'drizzle-orm';
import { users } from './users';
import { activities } from './activities';
import { goals } from './goals';
import { allowances } from './allowances';
import { streaks } from './streaks';
import { blockedApps } from './blockedApps';
import { usageSessions } from './usageSessions';
import { emergencyBypasses } from './emergencyBypasses';

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  activities: many(activities),
  goals: many(goals),
  allowances: many(allowances),
  streak: one(streaks),
  blockedApps: one(blockedApps), // One blocked apps config per user
  usageSessions: many(usageSessions),
  emergencyBypasses: many(emergencyBypasses),
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

export const blockedAppsRelations = relations(blockedApps, ({ one }) => ({
  user: one(users, {
    fields: [blockedApps.userId],
    references: [users.id],
  }),
}));

export const usageSessionsRelations = relations(usageSessions, ({ one }) => ({
  user: one(users, {
    fields: [usageSessions.userId],
    references: [users.id],
  }),
  allowance: one(allowances, {
    fields: [usageSessions.allowanceId],
    references: [allowances.id],
  }),
}));

export const emergencyBypassesRelations = relations(emergencyBypasses, ({ one }) => ({
  user: one(users, {
    fields: [emergencyBypasses.userId],
    references: [users.id],
  }),
}));

// Export all schemas
export { users, activities, goals, allowances, streaks, blockedApps, usageSessions, emergencyBypasses };
export * from './users';
export * from './activities';
export * from './goals';
export * from './allowances';
export * from './streaks';
export * from './blockedApps';
export * from './usageSessions';
export * from './emergencyBypasses';
