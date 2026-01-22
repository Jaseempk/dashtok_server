import { db } from '@/db';
import { users, streaks, allowances } from '@/db/schema';
import { and, eq, isNotNull, or, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * Repository for notification-related database queries
 */
class NotificationsRepository {
  /**
   * Get users who need streak at risk notifications
   * Criteria:
   * - Has a push token
   * - Notifications enabled
   * - Streak alerts enabled
   * - Has an active streak (currentStreak > 0)
   * - Hasn't completed today's goal (no unlocked allowance for today)
   */
  async getUsersForStreakAlert(today: string) {
    // Join users with streaks to find users at risk
    const result = await db
      .select({
        userId: users.id,
        pushToken: users.pushToken,
        currentStreak: streaks.currentStreak,
        lastCompletedDate: streaks.lastCompletedDate,
      })
      .from(users)
      .innerJoin(streaks, eq(users.id, streaks.userId))
      .leftJoin(
        allowances,
        and(eq(users.id, allowances.userId), eq(allowances.date, today))
      )
      .where(
        and(
          isNotNull(users.pushToken),
          eq(users.notificationsEnabled, true),
          eq(users.streakAlertsEnabled, true),
          // Has an active streak
          sql`${streaks.currentStreak} > 0`,
          // Hasn't completed today's goal
          or(isNull(allowances.isUnlocked), eq(allowances.isUnlocked, false))
        )
      );

    return result.filter((r) => r.pushToken !== null) as Array<{
      userId: string;
      pushToken: string;
      currentStreak: number;
      lastCompletedDate: string | null;
    }>;
  }

  /**
   * Get users who need daily reminder notifications
   * Criteria:
   * - Has a push token
   * - Notifications enabled
   * - Daily reminder enabled
   * - Daily reminder time matches current hour (for their timezone)
   * Note: For simplicity, we check all users with daily reminders enabled
   * In production, you'd filter by timezone to send at the right local time
   */
  async getUsersForDailyReminder() {
    const result = await db
      .select({
        userId: users.id,
        pushToken: users.pushToken,
        dailyReminderTime: users.dailyReminderTime,
        timezone: users.timezone,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.pushToken),
          eq(users.notificationsEnabled, true),
          eq(users.dailyReminderEnabled, true)
        )
      );

    return result.filter((r) => r.pushToken !== null) as Array<{
      userId: string;
      pushToken: string;
      dailyReminderTime: string;
      timezone: string;
    }>;
  }

  /**
   * Get users who need weekly summary notifications
   * Criteria:
   * - Has a push token
   * - Notifications enabled
   * - Weekly summary enabled
   */
  async getUsersForWeeklySummary() {
    const result = await db
      .select({
        userId: users.id,
        pushToken: users.pushToken,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.pushToken),
          eq(users.notificationsEnabled, true),
          eq(users.weeklySummaryEnabled, true)
        )
      );

    return result.filter((r) => r.pushToken !== null) as Array<{
      userId: string;
      pushToken: string;
    }>;
  }

  /**
   * Get a user's weekly stats for summary notification
   */
  async getUserWeeklyStats(userId: string, startDate: string, endDate: string) {
    const result = await db
      .select({
        earnedMinutes: allowances.earnedMinutes,
        isUnlocked: allowances.isUnlocked,
        date: allowances.date,
      })
      .from(allowances)
      .where(
        and(
          eq(allowances.userId, userId),
          sql`${allowances.date} >= ${startDate}`,
          sql`${allowances.date} <= ${endDate}`
        )
      );

    const activeDays = result.filter((r) => r.isUnlocked).length;
    const totalMinutes = result.reduce((sum, r) => sum + r.earnedMinutes, 0);

    return { activeDays, totalMinutes };
  }
}

export const notificationsRepository = new NotificationsRepository();
