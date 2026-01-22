import { db } from '@/db';
import { usageSessions } from '@/db/schema';
import { eq, and, gte, lte, isNull, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { UsageSessionSource } from '@/db/schema';

class UsageRepository {
  async findById(id: string) {
    return db.query.usageSessions.findFirst({
      where: eq(usageSessions.id, id),
    });
  }

  async findActiveSession(userId: string) {
    // Find session that hasn't ended yet
    return db.query.usageSessions.findFirst({
      where: and(
        eq(usageSessions.userId, userId),
        isNull(usageSessions.endedAt)
      ),
      orderBy: [desc(usageSessions.startedAt)],
    });
  }

  async createSession(
    userId: string,
    allowanceId: string | null,
    source: UsageSessionSource
  ) {
    const [created] = await db
      .insert(usageSessions)
      .values({
        id: generateId(),
        userId,
        allowanceId,
        startedAt: new Date(),
        source,
      })
      .returning();

    return created;
  }

  async endSession(id: string, endedAt: Date, durationSeconds: number) {
    const [updated] = await db
      .update(usageSessions)
      .set({
        endedAt,
        durationSeconds,
      })
      .where(eq(usageSessions.id, id))
      .returning();

    return updated;
  }

  async findTodaySessions(userId: string, startOfDay: Date, endOfDay: Date) {
    return db.query.usageSessions.findMany({
      where: and(
        eq(usageSessions.userId, userId),
        gte(usageSessions.startedAt, startOfDay),
        lte(usageSessions.startedAt, endOfDay)
      ),
      orderBy: [desc(usageSessions.startedAt)],
    });
  }

  async sumTodayUsage(userId: string, startOfDay: Date, endOfDay: Date): Promise<number> {
    const sessions = await this.findTodaySessions(userId, startOfDay, endOfDay);

    return sessions.reduce((total, session) => {
      return total + (session.durationSeconds ?? 0);
    }, 0);
  }
}

export const usageRepository = new UsageRepository();
