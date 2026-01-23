import { pgTable, text, timestamp, integer, real, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const activityTypeEnum = ['run', 'walk'] as const;
export type ActivityType = (typeof activityTypeEnum)[number];

export const activitySourceEnum = ['healthkit', 'gps_tracked', 'manual'] as const;
export type ActivitySource = (typeof activitySourceEnum)[number];

export const activities = pgTable(
  'activities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityType: text('activity_type', { enum: activityTypeEnum }).notNull(),
    distanceMeters: real('distance_meters').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    steps: integer('steps'),
    calories: integer('calories'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }).notNull(),
    source: text('source', { enum: activitySourceEnum }).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    healthkitId: text('healthkit_id').unique(),

    // Anti-cheat trust scoring
    trustScore: integer('trust_score').default(0),
    trustFlags: text('trust_flags').array(),

    // Source metadata (for analytics, not scoring)
    sourceBundleId: text('source_bundle_id'),
    sourceDeviceModel: text('source_device_model'),
    routePointCount: integer('route_point_count'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('activities_user_id_idx').on(table.userId),
    index('activities_started_at_idx').on(table.startedAt),
    index('activities_user_started_idx').on(table.userId, table.startedAt),
  ]
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
