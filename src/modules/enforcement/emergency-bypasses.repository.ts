import { db } from '@/db';
import { emergencyBypasses, EMERGENCY_BYPASS_MINUTES } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

class EmergencyBypassesRepository {
  async findByUserAndDate(userId: string, date: string) {
    return db.query.emergencyBypasses.findFirst({
      where: and(
        eq(emergencyBypasses.userId, userId),
        eq(emergencyBypasses.date, date)
      ),
    });
  }

  async incrementBypass(userId: string, date: string): Promise<{ bypassCount: number; totalMinutes: number }> {
    const existing = await this.findByUserAndDate(userId, date);

    if (existing) {
      // Atomically increment existing record
      const [updated] = await db
        .update(emergencyBypasses)
        .set({
          bypassCount: existing.bypassCount + 1,
          totalMinutes: existing.totalMinutes + EMERGENCY_BYPASS_MINUTES,
        })
        .where(eq(emergencyBypasses.id, existing.id))
        .returning();

      return {
        bypassCount: updated.bypassCount,
        totalMinutes: updated.totalMinutes,
      };
    }

    // Create new record for today
    const [created] = await db
      .insert(emergencyBypasses)
      .values({
        id: generateId(),
        userId,
        date,
        bypassCount: 1,
        totalMinutes: EMERGENCY_BYPASS_MINUTES,
      })
      .returning();

    return {
      bypassCount: created.bypassCount,
      totalMinutes: created.totalMinutes,
    };
  }

  async getBypassCount(userId: string, date: string): Promise<number> {
    const bypass = await this.findByUserAndDate(userId, date);
    return bypass?.bypassCount ?? 0;
  }
}

export const emergencyBypassesRepository = new EmergencyBypassesRepository();
