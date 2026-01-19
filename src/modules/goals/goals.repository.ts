import { db } from '@/db';
import { goals } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { NewGoal } from '@/db/schema';

class GoalsRepository {
  async create(data: Omit<NewGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    const [goal] = await db
      .insert(goals)
      .values({
        ...data,
        id: generateId(),
      })
      .returning();
    return goal;
  }

  async findById(id: string) {
    return db.query.goals.findFirst({
      where: eq(goals.id, id),
    });
  }

  async findByUser(userId: string, activeOnly = false) {
    const conditions = [eq(goals.userId, userId)];

    if (activeOnly) {
      conditions.push(eq(goals.isActive, true));
    }

    return db.query.goals.findMany({
      where: and(...conditions),
      orderBy: (goals, { desc }) => [desc(goals.createdAt)],
    });
  }

  async update(id: string, data: Partial<NewGoal>) {
    const [goal] = await db
      .update(goals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(goals.id, id))
      .returning();
    return goal;
  }

  async delete(id: string) {
    await db.delete(goals).where(eq(goals.id, id));
  }
}

export const goalsRepository = new GoalsRepository();
