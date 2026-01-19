import { streaksRepository } from './streaks.repository';
import { allowancesRepository } from '../allowances/allowances.repository';

class StreaksService {
  async getStreak(userId: string) {
    let streak = await streaksRepository.findByUser(userId);

    if (!streak) {
      streak = await streaksRepository.upsert(userId, {
        currentStreak: 0,
        longestStreak: 0,
        multiplier: 1.0,
      });
    }

    return streak;
  }

  async updateStreak(userId: string) {
    // Get today's date string
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if today's goal was completed
    const todayAllowance = await allowancesRepository.findByUserAndDate(userId, today);

    if (!todayAllowance?.isUnlocked) {
      // Goal not completed today, no update needed
      return this.getStreak(userId);
    }

    const currentStreak = await streaksRepository.findByUser(userId);
    const lastCompletedDate = currentStreak?.lastCompletedDate;

    // Determine new streak value
    let newStreak = 1;

    if (lastCompletedDate === today) {
      // Already counted today
      return currentStreak;
    } else if (lastCompletedDate === yesterday) {
      // Continuing streak
      newStreak = (currentStreak?.currentStreak ?? 0) + 1;
    }
    // else: streak broken or new user, starts at 1

    // Calculate multiplier based on streak length
    const multiplier = this.calculateMultiplier(newStreak);

    // Update longest streak if needed
    const longestStreak = Math.max(newStreak, currentStreak?.longestStreak ?? 0);

    return streaksRepository.upsert(userId, {
      currentStreak: newStreak,
      longestStreak,
      lastCompletedDate: today,
      multiplier,
    });
  }

  async resetStreak(userId: string) {
    return streaksRepository.reset(userId);
  }

  private calculateMultiplier(streakDays: number): number {
    // Multiplier tiers:
    // 1-6 days: 1.0x
    // 7-13 days: 1.1x
    // 14-29 days: 1.25x
    // 30+ days: 1.5x
    if (streakDays >= 30) return 1.5;
    if (streakDays >= 14) return 1.25;
    if (streakDays >= 7) return 1.1;
    return 1.0;
  }

  async checkAndResetBrokenStreaks(userId: string) {
    // Called to check if streak should be reset (e.g., on app open)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const streak = await streaksRepository.findByUser(userId);

    if (!streak || !streak.lastCompletedDate) {
      return streak;
    }

    // If last completed date is before yesterday, streak is broken
    if (streak.lastCompletedDate < yesterday) {
      return streaksRepository.upsert(userId, {
        currentStreak: 0,
        multiplier: 1.0,
        // Keep lastCompletedDate for history
      });
    }

    return streak;
  }
}

export const streaksService = new StreaksService();
