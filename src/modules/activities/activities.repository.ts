import { db } from '@/db';
import { activities } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { NewActivity, ActivityType } from '@/db/schema';

type ActivityFilters = {
  from?: string;
  to?: string;
  type?: ActivityType;
  limit: number;
  page: number;
};

class ActivitiesRepository {
  async create(data: Omit<NewActivity, 'id' | 'createdAt'>) {
    const [activity] = await db
      .insert(activities)
      .values({
        ...data,
        id: generateId(),
      })
      .returning();
    return activity;
  }

  async findById(id: string) {
    return db.query.activities.findFirst({
      where: eq(activities.id, id),
    });
  }

  async findByHealthkitId(healthkitId: string) {
    return db.query.activities.findFirst({
      where: eq(activities.healthkitId, healthkitId),
    });
  }

  async findByUser(userId: string, filters: ActivityFilters) {
    const conditions = [eq(activities.userId, userId)];

    if (filters.from) {
      conditions.push(gte(activities.startedAt, new Date(filters.from)));
    }
    if (filters.to) {
      conditions.push(lte(activities.startedAt, new Date(filters.to)));
    }
    if (filters.type) {
      conditions.push(eq(activities.activityType, filters.type));
    }

    const whereClause = and(...conditions);
    const offset = (filters.page - 1) * filters.limit;

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(activities)
        .where(whereClause)
        .orderBy(desc(activities.startedAt))
        .limit(filters.limit)
        .offset(offset),
      db.select({ count: count() }).from(activities).where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async sumDistanceForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    activityType?: ActivityType
  ) {
    const conditions = [
      eq(activities.userId, userId),
      gte(activities.startedAt, startDate),
      lte(activities.startedAt, endDate),
    ];

    if (activityType) {
      conditions.push(eq(activities.activityType, activityType));
    }

    const result = await db
      .select({
        totalDistance: sql<number>`COALESCE(SUM(${activities.distanceMeters}), 0)`,
        totalDuration: sql<number>`COALESCE(SUM(${activities.durationSeconds}), 0)`,
        count: count(),
      })
      .from(activities)
      .where(and(...conditions));

    return result[0] ?? { totalDistance: 0, totalDuration: 0, count: 0 };
  }

  async delete(id: string) {
    await db.delete(activities).where(eq(activities.id, id));
  }
}

export const activitiesRepository = new ActivitiesRepository();
