import { allowancesRepository } from './allowances.repository';
import { activitiesRepository } from '../activities/activities.repository';
import { goalsRepository } from '../goals/goals.repository';
import { streaksRepository } from '../streaks/streaks.repository';
import { Errors } from '@/lib/errors';
import type { AllowanceHistoryFilters } from './allowances.schemas';

class AllowancesService {
  async getTodayAllowance(userId: string, timezone: string) {
    const today = this.getDateString(new Date(), timezone);
    let allowance = await allowancesRepository.findByUserAndDate(userId, today);

    if (!allowance) {
      // Create today's allowance if it doesn't exist
      allowance = await this.recalculateForDate(userId, today, timezone);
    }

    return allowance;
  }

  async recalculateForToday(userId: string) {
    // TODO: Get user's timezone from profile
    const timezone = 'UTC';
    const today = this.getDateString(new Date(), timezone);
    return this.recalculateForDate(userId, today, timezone);
  }

  async recalculateForDate(userId: string, dateStr: string, _timezone: string) {
    // Get start and end of the day
    const startOfDay = new Date(`${dateStr}T00:00:00Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59Z`);

    // Get today's activities and calculate trust-weighted distance
    const dayActivities = await activitiesRepository.findByDateRange(
      userId,
      startOfDay,
      endOfDay
    );

    // Apply trust weighting to distance
    let totalDistance = 0;
    for (const activity of dayActivities) {
      const multiplier = this.getTrustMultiplier(activity.trustScore ?? 0);
      totalDistance += activity.distanceMeters * multiplier;
    }

    // Get active goals
    const goals = await goalsRepository.findByUser(userId, true);

    // Calculate earned minutes based on goals
    let earnedMinutes = 0;
    let isUnlocked = false;

    for (const goal of goals) {
      if (goal.goalType !== 'daily') continue;

      const targetMeters = this.convertToMeters(goal.targetValue, goal.targetUnit);
      const progress = totalDistance / targetMeters;

      if (progress >= 1) {
        // Goal completed
        earnedMinutes += goal.rewardMinutes;
        isUnlocked = true;
      } else {
        // Partial credit (optional - can remove if you want all-or-nothing)
        // earnedMinutes += Math.floor(goal.rewardMinutes * progress);
      }
    }

    // Get streak bonus
    const streak = await streaksRepository.findByUser(userId);
    const bonusMinutes = streak
      ? Math.floor(earnedMinutes * (streak.multiplier - 1))
      : 0;

    // Update or create allowance
    return allowancesRepository.upsert(userId, dateStr, {
      earnedMinutes,
      bonusMinutes,
      isUnlocked,
      unlockedAt: isUnlocked ? new Date() : undefined,
    });
  }

  /**
   * Get trust multiplier for activity distance weighting.
   * Clean activities (score >= 0) get full credit.
   */
  private getTrustMultiplier(trustScore: number): number {
    if (trustScore >= 0) return 1.0;    // Clean = full credit
    if (trustScore >= -2) return 0.5;   // Minor flags = reduced
    return 0;                           // Major flags = no credit
  }

  async getHistory(userId: string, filters: AllowanceHistoryFilters) {
    return allowancesRepository.findHistory(userId, filters);
  }

  async updateUsedMinutes(userId: string, usedMinutes: number, timezone: string) {
    const today = this.getDateString(new Date(), timezone);
    const allowance = await allowancesRepository.findByUserAndDate(userId, today);

    if (!allowance) {
      throw Errors.notFound('Allowance for today');
    }

    const totalAvailable = allowance.earnedMinutes + allowance.bonusMinutes;
    if (usedMinutes > totalAvailable) {
      throw Errors.validation({
        usedMinutes: [`Cannot exceed available minutes (${totalAvailable})`],
      });
    }

    return allowancesRepository.updateUsedMinutes(allowance.id, usedMinutes);
  }

  private getDateString(date: Date, timezone: string): string {
    return date.toLocaleDateString('en-CA', { timeZone: timezone }); // Returns YYYY-MM-DD
  }

  private convertToMeters(value: number, unit: string): number {
    switch (unit) {
      case 'km':
        return value * 1000;
      case 'miles':
        return value * 1609.34;
      case 'steps':
        // Approximate: 1 step ≈ 0.75 meters
        return value * 0.75;
      default:
        return value;
    }
  }

  async getRemainingMinutes(userId: string, timezone: string) {
    const allowance = await this.getTodayAllowance(userId, timezone);
    const total = allowance.earnedMinutes + allowance.bonusMinutes;
    return Math.max(0, total - allowance.usedMinutes);
  }
}

export const allowancesService = new AllowancesService();
