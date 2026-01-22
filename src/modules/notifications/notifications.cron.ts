import { notificationsRepository } from './notifications.repository';
import { notificationsService } from './notifications.service';

/**
 * Notification cron job handlers
 * These functions are called by the cron scheduler to send push notifications
 */

/**
 * Send streak at risk notifications
 * Should run daily around 8 PM local time for users
 * For MVP, runs at 8 PM server time (UTC)
 */
export async function sendStreakAlertNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[Cron] Running streak alert job for ${today}`);

  try {
    const users = await notificationsRepository.getUsersForStreakAlert(today);
    console.log(`[Cron] Found ${users.length} users for streak alerts`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const result = await notificationsService.sendStreakAtRiskNotification(
        user.pushToken,
        user.currentStreak
      );

      if (result?.status === 'ok') {
        sent++;
      } else {
        failed++;
        console.warn(`[Cron] Failed to send streak alert to user ${user.userId}`);
      }
    }

    console.log(`[Cron] Streak alerts: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  } catch (error) {
    console.error('[Cron] sendStreakAlertNotifications error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send daily reminder notifications
 * Should run at various times based on user preferences
 * For MVP, runs every hour and filters users by their reminder time
 */
export async function sendDailyReminderNotifications(
  currentHour: number
): Promise<{
  sent: number;
  failed: number;
}> {
  const hourStr = currentHour.toString().padStart(2, '0');
  console.log(`[Cron] Running daily reminder job for hour ${hourStr}`);

  try {
    const users = await notificationsRepository.getUsersForDailyReminder();

    // Filter users whose reminder time matches current hour
    const matchingUsers = users.filter((user) => {
      const reminderHour = parseInt(user.dailyReminderTime.split(':')[0], 10);
      return reminderHour === currentHour;
    });

    console.log(`[Cron] Found ${matchingUsers.length} users for daily reminders at ${hourStr}:00`);

    let sent = 0;
    let failed = 0;

    for (const user of matchingUsers) {
      const result = await notificationsService.sendDailyReminderNotification(user.pushToken);

      if (result?.status === 'ok') {
        sent++;
      } else {
        failed++;
        console.warn(`[Cron] Failed to send daily reminder to user ${user.userId}`);
      }
    }

    console.log(`[Cron] Daily reminders: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  } catch (error) {
    console.error('[Cron] sendDailyReminderNotifications error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send weekly summary notifications
 * Should run on Sundays
 */
export async function sendWeeklySummaryNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  // Check if today is Sunday
  const today = new Date();
  if (today.getDay() !== 0) {
    console.log('[Cron] Skipping weekly summary - not Sunday');
    return { sent: 0, failed: 0 };
  }

  console.log('[Cron] Running weekly summary job');

  try {
    const users = await notificationsRepository.getUsersForWeeklySummary();
    console.log(`[Cron] Found ${users.length} users for weekly summary`);

    // Calculate week range (Monday to Sunday)
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const stats = await notificationsRepository.getUserWeeklyStats(
        user.userId,
        startDate,
        endDate
      );

      const result = await notificationsService.sendWeeklySummaryNotification(
        user.pushToken,
        stats
      );

      if (result?.status === 'ok') {
        sent++;
      } else {
        failed++;
        console.warn(`[Cron] Failed to send weekly summary to user ${user.userId}`);
      }
    }

    console.log(`[Cron] Weekly summaries: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  } catch (error) {
    console.error('[Cron] sendWeeklySummaryNotifications error:', error);
    return { sent: 0, failed: 0 };
  }
}
