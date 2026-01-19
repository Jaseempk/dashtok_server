import { activitiesRepository } from './activities.repository';
import { allowancesService } from '../allowances/allowances.service';
import { streaksService } from '../streaks/streaks.service';
import { Errors } from '@/lib/errors';
import { MAX_RUNNING_SPEED_KMH, MAX_WALKING_SPEED_KMH } from '@/config/constants';
import type { CreateActivityInput, ActivityFilters } from './activities.schemas';

class ActivitiesService {
  async createActivity(userId: string, data: CreateActivityInput) {
    // Validate the activity
    this.validateActivityData(data);

    // Check for duplicates
    if (data.healthkitId) {
      const existing = await activitiesRepository.findByHealthkitId(data.healthkitId);
      if (existing) {
        throw Errors.duplicateActivity();
      }
    }

    // Determine if verified (GPS tracked)
    const isVerified = data.source === 'gps_tracked';

    // Create the activity
    const activity = await activitiesRepository.create({
      ...data,
      userId,
      startedAt: new Date(data.startedAt),
      endedAt: new Date(data.endedAt),
      isVerified,
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
