import { db } from '@/db';
import { allowances } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { NewAllowance } from '@/db/schema';

class AllowancesRepository {
  async findByUserAndDate(userId: string, date: string) {
    return db.query.allowances.findFirst({
      where: and(eq(allowances.userId, userId), eq(allowances.date, date)),
    });
  }

  async upsert(userId: string, date: string, data: Partial<NewAllowance>) {
    const existing = await this.findByUserAndDate(userId, date);

    if (existing) {
      const [updated] = await db
        .update(allowances)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(allowances.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(allowances)
      .values({
        id: generateId(),
        userId,
        date,
        earnedMinutes: data.earnedMinutes ?? 0,
        usedMinutes: data.usedMinutes ?? 0,
        bonusMinutes: data.bonusMinutes ?? 0,
        isUnlocked: data.isUnlocked ?? false,
        unlockedAt: data.unlockedAt,
      })
      .returning();

    return created;
  }

  async findHistory(
    userId: string,
    filters: { from?: string; to?: string; limit: number }
  ) {
    const conditions = [eq(allowances.userId, userId)];

    if (filters.from) {
      conditions.push(gte(allowances.date, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(allowances.date, filters.to));
    }

    return db.query.allowances.findMany({
      where: and(...conditions),
      orderBy: [desc(allowances.date)],
      limit: filters.limit,
    });
  }

  async updateUsedMinutes(id: string, usedMinutes: number) {
    const [updated] = await db
      .update(allowances)
      .set({ usedMinutes, updatedAt: new Date() })
      .where(eq(allowances.id, id))
      .returning();
    return updated;
  }
}

export const allowancesRepository = new AllowancesRepository();
