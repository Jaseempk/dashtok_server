/**
 * Server-side notification service
 * Sends push notifications via Expo Push API
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

export interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

export type NotificationType =
  | 'daily_reminder'
  | 'streak_at_risk'
  | 'goal_completed'
  | 'weekly_summary';

class NotificationsService {
  /**
   * Send a single push notification
   */
  async sendPushNotification(message: ExpoPushMessage): Promise<ExpoPushTicket | null> {
    const results = await this.sendPushNotifications([message]);
    return results[0] ?? null;
  }

  /**
   * Send multiple push notifications (batched)
   * Expo allows up to 100 messages per request
   */
  async sendPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    if (messages.length === 0) {
      return [];
    }

    // Validate all tokens are Expo push tokens
    const validMessages = messages.filter((msg) => this.isExpoPushToken(msg.to));

    if (validMessages.length === 0) {
      console.warn('[Notifications] No valid Expo push tokens');
      return [];
    }

    try {
      // Batch into chunks of 100 (Expo's limit)
      const chunks = this.chunkArray(validMessages, 100);
      const allTickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          console.error('[Notifications] Expo Push API error:', response.status);
          continue;
        }

        const result = (await response.json()) as { data: ExpoPushTicket[] };
        allTickets.push(...result.data);
      }

      // Log any errors
      allTickets.forEach((ticket) => {
        if (ticket.status === 'error') {
          console.error(
            '[Notifications] Push failed:',
            ticket.message,
            ticket.details?.error
          );
        }
      });

      return allTickets;
    } catch (error) {
      console.error('[Notifications] sendPushNotifications error:', error);
      return [];
    }
  }

  /**
   * Send streak at risk notification
   */
  async sendStreakAtRiskNotification(
    pushToken: string,
    streakDays: number
  ): Promise<ExpoPushTicket | null> {
    return this.sendPushNotification({
      to: pushToken,
      title: 'Streak at risk! 🔥',
      body: `Don't break your ${streakDays}-day streak! Complete your goal today.`,
      data: {
        type: 'streak_at_risk' as NotificationType,
        deepLink: 'dashtok://home',
        streakDays,
      },
      sound: 'default',
      priority: 'high',
    });
  }

  /**
   * Send goal completed notification
   */
  async sendGoalCompletedNotification(
    pushToken: string,
    goalName: string,
    screenTimeEarned: number
  ): Promise<ExpoPushTicket | null> {
    return this.sendPushNotification({
      to: pushToken,
      title: 'Goal crushed! 🎯',
      body: `You earned ${screenTimeEarned} min screen time.`,
      data: {
        type: 'goal_completed' as NotificationType,
        deepLink: 'dashtok://activities',
        goalName,
        screenTimeEarned,
      },
      sound: 'default',
    });
  }

  /**
   * Send daily reminder notification
   */
  async sendDailyReminderNotification(pushToken: string): Promise<ExpoPushTicket | null> {
    return this.sendPushNotification({
      to: pushToken,
      title: 'Morning kick-off! ☀️',
      body: "Sun's up! Let's hit that goal today.",
      data: {
        type: 'daily_reminder' as NotificationType,
        deepLink: 'dashtok://home',
      },
      sound: 'default',
    });
  }

  /**
   * Send weekly summary notification
   */
  async sendWeeklySummaryNotification(
    pushToken: string,
    weekStats: { activeDays: number; totalMinutes: number }
  ): Promise<ExpoPushTicket | null> {
    return this.sendPushNotification({
      to: pushToken,
      title: 'Weekly stats ready! 📊',
      body: `You were active ${weekStats.activeDays} days and earned ${weekStats.totalMinutes} min this week!`,
      data: {
        type: 'weekly_summary' as NotificationType,
        deepLink: 'dashtok://profile',
        ...weekStats,
      },
      sound: 'default',
    });
  }

  /**
   * Check if a string is a valid Expo push token
   */
  private isExpoPushToken(token: string): boolean {
    return /^Expo(nent)?PushToken\[.+\]$/.test(token);
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export const notificationsService = new NotificationsService();
