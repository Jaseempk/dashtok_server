import { db } from '@/db';
import { streaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { NewStreak } from '@/db/schema';

class StreaksRepository {
  async findByUser(userId: string) {
    return db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });
  }

  async upsert(userId: string, data: Partial<NewStreak>) {
    const existing = await this.findByUser(userId);

    if (existing) {
      const [updated] = await db
        .update(streaks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(streaks.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(streaks)
      .values({
        id: generateId(),
        userId,
        currentStreak: data.currentStreak ?? 0,
        longestStreak: data.longestStreak ?? 0,
        lastCompletedDate: data.lastCompletedDate,
        multiplier: data.multiplier ?? 1.0,
      })
      .returning();

    return created;
  }

  async reset(userId: string) {
    return this.upsert(userId, {
      currentStreak: 0,
      multiplier: 1.0,
      lastCompletedDate: null,
    });
  }
}

export const streaksRepository = new StreaksRepository();
