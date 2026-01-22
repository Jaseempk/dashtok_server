import { allowancesService } from '../allowances/allowances.service';
import { blockedAppsService } from '../blocked-apps/blocked-apps.service';
import { goalsRepository } from '../goals/goals.repository';
import { activitiesRepository } from '../activities/activities.repository';
import { emergencyBypassesRepository } from './emergency-bypasses.repository';
import { EMERGENCY_BYPASS_LIMIT, EMERGENCY_BYPASS_MINUTES } from '@/db/schema';
import type { EnforcementStatus, UnlockResult, LockResult, BypassResult, EnforcementReason } from './enforcement.schemas';

class EnforcementService {
  /**
   * Get current enforcement status for user
   * Server calculates everything - client just displays
   */
  async getStatus(userId: string, timezone: string): Promise<EnforcementStatus> {
    // Check if user has blocked apps configured
    const hasBlockedApps = await blockedAppsService.hasBlockedApps(userId);
    if (!hasBlockedApps) {
      return this.createStatus('no_blocked_apps', {
        shouldBlock: false,
        remainingMinutes: 0,
        totalMinutes: 0,
        usedMinutes: 0,
        isUnlocked: false,
      });
    }

    // Check if enforcement is active
    const isEnforcementActive = await blockedAppsService.isEnforcementActive(userId);
    if (!isEnforcementActive) {
      return this.createStatus('enforcement_disabled', {
        shouldBlock: false,
        remainingMinutes: 0,
        totalMinutes: 0,
        usedMinutes: 0,
        isUnlocked: false,
      });
    }

    // Get today's allowance (server-calculated)
    const allowance = await allowancesService.getTodayAllowance(userId, timezone);
    const totalMinutes = allowance.earnedMinutes + allowance.bonusMinutes;
    const usedMinutes = allowance.realUsedMinutes;
    const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);

    // Get goal progress for next unlock requirement
    const nextUnlockRequirement = await this.getNextUnlockRequirement(userId, timezone);

    // Get emergency bypass status
    const today = this.getDateString(new Date(), timezone);
    const bypassCount = await emergencyBypassesRepository.getBypassCount(userId, today);
    const emergencyBypassesLeft = Math.max(0, EMERGENCY_BYPASS_LIMIT - bypassCount);

    // Determine if should block
    let shouldBlock: boolean;
    let reason: EnforcementReason;

    if (!allowance.isUnlocked) {
      // Goal not completed - block
      shouldBlock = true;
      reason = 'goal_incomplete';
    } else if (remainingMinutes <= 0) {
      // Time exhausted - block
      shouldBlock = true;
      reason = 'time_exhausted';
    } else {
      // Unlocked with time remaining - don't block
      shouldBlock = false;
      reason = 'unlocked';
    }

    return {
      shouldBlock,
      reason,
      remainingMinutes,
      totalMinutes,
      usedMinutes,
      nextUnlockRequirement,
      emergencyBypassAvailable: emergencyBypassesLeft > 0,
      emergencyBypassesLeft,
      isUnlocked: allowance.isUnlocked,
    };
  }

  /**
   * Request to unlock apps
   * SECURITY: Server validates goal completion - never trust client
   */
  async requestUnlock(userId: string, timezone: string): Promise<UnlockResult> {
    // Get today's allowance (server-calculated, not from client)
    const allowance = await allowancesService.getTodayAllowance(userId, timezone);

    // Verify goal completion (server-side check)
    if (!allowance.isUnlocked) {
      return { unlocked: false, reason: 'goal_incomplete' };
    }

    // Check remaining time (server-calculated)
    const totalMinutes = allowance.earnedMinutes + allowance.bonusMinutes;
    const remaining = totalMinutes - allowance.realUsedMinutes;

    if (remaining <= 0) {
      return { unlocked: false, reason: 'time_exhausted' };
    }

    // Grant unlock (server authoritative)
    return { unlocked: true, durationMinutes: remaining };
  }

  /**
   * Request to lock apps (manual lock or time exhausted)
   */
  async requestLock(userId: string, _timezone: string): Promise<LockResult> {
    // Verify user has blocked apps configured
    const hasBlockedApps = await blockedAppsService.hasBlockedApps(userId);
    if (!hasBlockedApps) {
      return { locked: false };
    }

    // Lock is always allowed - it's a restriction, not a privilege
    return { locked: true };
  }

  /**
   * Request emergency bypass
   * SECURITY: Rate limited to max 3 per day (server enforced)
   */
  async requestEmergencyBypass(userId: string, timezone: string): Promise<BypassResult> {
    const today = this.getDateString(new Date(), timezone);

    // Check daily limit (server enforced)
    const currentCount = await emergencyBypassesRepository.getBypassCount(userId, today);

    if (currentCount >= EMERGENCY_BYPASS_LIMIT) {
      return { granted: false, reason: 'daily_limit_reached' };
    }

    // Atomically increment counter
    const result = await emergencyBypassesRepository.incrementBypass(userId, today);

    return {
      granted: true,
      minutesGranted: EMERGENCY_BYPASS_MINUTES,
      bypassesRemaining: Math.max(0, EMERGENCY_BYPASS_LIMIT - result.bypassCount),
    };
  }

  /**
   * Get what user needs to do to unlock more time
   */
  private async getNextUnlockRequirement(userId: string, timezone: string) {
    // Get active daily goal
    const goals = await goalsRepository.findByUser(userId, true);
    const dailyGoal = goals.find((g) => g.goalType === 'daily');

    if (!dailyGoal) {
      return null;
    }

    // Get today's activity progress
    const today = this.getDateString(new Date(), timezone);
    const startOfDay = new Date(`${today}T00:00:00Z`);
    const endOfDay = new Date(`${today}T23:59:59Z`);

    const activityStats = await activitiesRepository.sumDistanceForDateRange(
      userId,
      startOfDay,
      endOfDay
    );

    // Convert to target unit
    const targetMeters = this.convertToMeters(dailyGoal.targetValue, dailyGoal.targetUnit);
    const currentMeters = activityStats.totalDistance;
    const currentInTargetUnit = this.convertFromMeters(currentMeters, dailyGoal.targetUnit);
    const percentComplete = Math.min(100, (currentMeters / targetMeters) * 100);

    return {
      type: 'distance' as const,
      current: Math.round(currentInTargetUnit * 100) / 100,
      target: dailyGoal.targetValue,
      unit: dailyGoal.targetUnit as 'km' | 'miles',
      percentComplete: Math.round(percentComplete),
    };
  }

  private createStatus(
    reason: EnforcementReason,
    overrides: Partial<EnforcementStatus>
  ): EnforcementStatus {
    return {
      shouldBlock: false,
      reason,
      remainingMinutes: 0,
      totalMinutes: 0,
      usedMinutes: 0,
      nextUnlockRequirement: null,
      emergencyBypassAvailable: false,
      emergencyBypassesLeft: 0,
      isUnlocked: false,
      ...overrides,
    };
  }

  private getDateString(date: Date, timezone: string): string {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  }

  private convertToMeters(value: number, unit: string): number {
    switch (unit) {
      case 'km':
        return value * 1000;
      case 'miles':
        return value * 1609.34;
      case 'steps':
        return value * 0.75;
      default:
        return value;
    }
  }

  private convertFromMeters(meters: number, unit: string): number {
    switch (unit) {
      case 'km':
        return meters / 1000;
      case 'miles':
        return meters / 1609.34;
      case 'steps':
        return meters / 0.75;
      default:
        return meters;
    }
  }
}

export const enforcementService = new EnforcementService();
