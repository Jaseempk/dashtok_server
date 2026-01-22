import { pgTable, text, timestamp, integer, boolean, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const blockedApps = pgTable(
  'blocked_apps',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    selectionData: text('selection_data').notNull(), // Serialized FamilyActivitySelection (opaque iOS token)
    selectionId: text('selection_id').notNull(), // ID for react-native-device-activity
    appCount: integer('app_count').default(0).notNull(), // Number of apps selected (for display)
    categoryCount: integer('category_count').default(0).notNull(), // Number of categories selected
    isActive: boolean('is_active').default(true).notNull(), // Master toggle for enforcement
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    // Pending changes (24h cooldown for permissive changes)
    pendingSelectionData: text('pending_selection_data'), // Pending app selection (removing apps)
    pendingAppCount: integer('pending_app_count'), // Pending app count
    pendingCategoryCount: integer('pending_category_count'), // Pending category count
    pendingIsActive: boolean('pending_is_active'), // Pending enforcement toggle (disabling)
    pendingAppliesAt: timestamp('pending_applies_at', { withTimezone: true }), // When pending changes apply
  },
  (table) => [
    unique('blocked_apps_user_id_unique').on(table.userId), // One config per user
    index('blocked_apps_user_id_idx').on(table.userId),
  ]
);

export type BlockedApp = typeof blockedApps.$inferSelect;
export type NewBlockedApp = typeof blockedApps.$inferInsert;
