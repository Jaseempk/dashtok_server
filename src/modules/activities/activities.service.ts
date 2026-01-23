import { activitiesRepository } from './activities.repository';
import { allowancesService } from '../allowances/allowances.service';
import { streaksService } from '../streaks/streaks.service';
import { Errors } from '@/lib/errors';
import { MAX_RUNNING_SPEED_KMH, MAX_WALKING_SPEED_KMH } from '@/config/constants';
import type { CreateActivityInput, ActivityFilters } from './activities.schemas';

class ActivitiesService {
  async createActivity(userId: string, data: CreateActivityInput) {
    // Validate the activity (hard rejection for impossible data)
    this.validateActivityData(data);

    // Check for duplicates
    if (data.healthkitId) {
      const existing = await activitiesRepository.findByHealthkitId(data.healthkitId);
      if (existing) {
        throw Errors.duplicateActivity();
      }
    }

    // Calculate trust score (soft penalties for suspicious patterns)
    const { score: trustScore, flags: trustFlags } = this.calculateTrust(data);

    // Determine if verified (high trust or GPS tracked)
    const isVerified = data.source === 'gps_tracked' || trustScore >= 0;

    // Create the activity with trust metadata
    const activity = await activitiesRepository.create({
      ...data,
      userId,
      startedAt: new Date(data.startedAt),
      endedAt: new Date(data.endedAt),
      isVerified,
      trustScore,
      trustFlags,
      sourceBundleId: data.sourceBundleId,
      sourceDeviceModel: data.sourceDeviceModel,
      routePointCount: data.routePointCount,
    });

    // Update allowances and streaks (fire and forget for now)
    this.updateUserProgress(userId).catch(console.error);

    return activity;
  }

  async getUserActivities(userId: string, filters: ActivityFilters) {
    return activitiesRepository.findByUser(userId, filters);
  }

  async getActivity(userId: string, activityId: string) {
    const activity = await activitiesRepository.findById(activityId);

    if (!activity) {
      throw Errors.notFound('Activity');
    }

    if (activity.userId !== userId) {
      throw Errors.forbidden('Not authorized to access this activity');
    }

    return activity;
  }

  async deleteActivity(userId: string, activityId: string) {
    const activity = await this.getActivity(userId, activityId);
    await activitiesRepository.delete(activity.id);

    // Recalculate allowances after deletion
    this.updateUserProgress(userId).catch(console.error);
  }

  private validateActivityData(data: CreateActivityInput) {
    // Check: activity can't be in the future
    if (new Date(data.startedAt) > new Date()) {
      throw Errors.invalidActivity('Activity cannot be in the future');
    }

    // Check: end time must be after start time
    if (new Date(data.endedAt) <= new Date(data.startedAt)) {
      throw Errors.invalidActivity('End time must be after start time');
    }

    // Check: reasonable speed (anti-cheat)
    const distanceKm = data.distanceMeters / 1000;
    const durationHours = data.durationSeconds / 3600;
    const speedKmH = distanceKm / durationHours;

    const maxSpeed =
      data.activityType === 'run' ? MAX_RUNNING_SPEED_KMH : MAX_WALKING_SPEED_KMH;

    if (speedKmH > maxSpeed) {
      throw Errors.invalidActivity(
        `Activity speed (${speedKmH.toFixed(1)} km/h) exceeds maximum for ${data.activityType}`
      );
    }

    // Check: reasonable duration (not more than 24 hours)
    if (data.durationSeconds > 86400) {
      throw Errors.invalidActivity('Activity duration cannot exceed 24 hours');
    }
  }

  /**
   * Calculate trust score for an activity (penalty-based).
   * Start at 0, subtract for red flags. Score >= 0 = full credit.
   */
  private calculateTrust(data: CreateActivityInput): { score: number; flags: string[] } {
    let score = 0;
    const flags: string[] = [];

    // === MANUAL ENTRY (biggest red flag) ===
    if (data.isManualEntry) {
      score -= 5;
      flags.push('manual_entry');
    }

    // === STRIDE & SPEED VALIDATION ===
    if (data.steps && data.steps > 0) {
      const stride = data.distanceMeters / data.steps;
      const speedKmh = (data.distanceMeters / 1000) / (data.durationSeconds / 3600);

      // Shake rig: tiny strides (always suspicious)
      if (stride < 0.3) {
        score -= 4;
        flags.push('shake_rig_pattern');
      }
      // Impossible stride: too long
      else if (stride > 2.5) {
        score -= 2;
        flags.push('abnormal_stride');
      }
      // Speed+Stride mismatch: only flag extreme cases
      // Uses lenient thresholds to avoid false positives for short/elderly users
      else if ((speedKmh > 12 && stride < 0.6) || (speedKmh > 8 && stride < 0.4)) {
        score -= 3;
        flags.push('speed_stride_mismatch');
      }
    }

    // === ACTIVITY TYPE + SPEED SANITY CHECK ===
    const speedKmh = (data.distanceMeters / 1000) / (data.durationSeconds / 3600);
    if (data.activityType === 'walk' && speedKmh > 9) {
      score -= 2;
      flags.push('walk_speed_unrealistic');
    }

    // === BACKFILL DETECTION ===
    const now = new Date();
    const activityEndTime = new Date(data.endedAt);
    const hoursSinceEnd = (now.getTime() - activityEndTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceEnd > 24) {
      score -= 3;
      flags.push('potential_backfill');
    }

    // === SPARSE ROUTE (if route exists but suspiciously empty) ===
    if (data.routePointCount && data.routePointCount > 0) {
      const expectedPoints = data.durationSeconds / 60;
      if (data.routePointCount < expectedPoints * 0.3) {
        score -= 1;
        flags.push('sparse_route');
      }
    }

    return { score, flags };
  }

  private async updateUserProgress(userId: string) {
    await Promise.all([
      allowancesService.recalculateForToday(userId),
      streaksService.updateStreak(userId),
    ]);
  }

  async getTodayStats(userId: string, timezone: string) {
    const now = new Date();
    const startOfDay = new Date(now.toLocaleDateString('en-US', { timeZone: timezone }));
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return activitiesRepository.sumDistanceForDateRange(userId, startOfDay, endOfDay);
  }
}

export const activitiesService = new ActivitiesService();
