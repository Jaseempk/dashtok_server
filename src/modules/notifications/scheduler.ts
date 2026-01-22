import cron from 'node-cron';
import {
  sendStreakAlertNotifications,
  sendDailyReminderNotifications,
  sendWeeklySummaryNotifications,
} from './notifications.cron';

/**
 * Initialize notification cron jobs
 * Call this once when the server starts
 */
export function initializeNotificationScheduler(): void {
  console.log('[Scheduler] Initializing notification cron jobs...');

  // Daily reminders - run every hour at minute 0
  // Checks each user's preferred reminder time
  cron.schedule('0 * * * *', async () => {
    const currentHour = new Date().getUTCHours();
    await sendDailyReminderNotifications(currentHour);
  });
  console.log('[Scheduler] Daily reminder job scheduled (every hour at :00)');

  // Streak alerts - run daily at 8 PM UTC (20:00)
  // Users who haven't met their goal get a reminder
  cron.schedule('0 20 * * *', async () => {
    await sendStreakAlertNotifications();
  });
  console.log('[Scheduler] Streak alert job scheduled (daily at 20:00 UTC)');

  // Weekly summary - run every Sunday at 10 AM UTC
  cron.schedule('0 10 * * 0', async () => {
    await sendWeeklySummaryNotifications();
  });
  console.log('[Scheduler] Weekly summary job scheduled (Sundays at 10:00 UTC)');

  console.log('[Scheduler] All notification cron jobs initialized');
}

/**
 * Manually trigger jobs (for testing/admin purposes)
 */
export const manualTriggers = {
  streakAlerts: sendStreakAlertNotifications,
  dailyReminders: sendDailyReminderNotifications,
  weeklySummary: sendWeeklySummaryNotifications,
};
