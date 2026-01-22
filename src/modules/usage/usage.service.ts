import { usageRepository } from './usage.repository';
import { allowancesRepository } from '../allowances/allowances.repository';
import { Errors } from '@/lib/errors';
import type { StartSessionInput, EndSessionInput } from './usage.schemas';
import type { UsageSessionSource } from '@/db/schema';

// Maximum session duration: 24 hours (in seconds)
const MAX_SESSION_DURATION_SECONDS = 86400;

class UsageService {
  async startSession(userId: string, input: StartSessionInput, timezone: string) {
    // Check if there's already an active session (idempotent: return existing)
    const activeSession = await usageRepository.findActiveSession(userId);
    if (activeSession) {
      // Return existing session instead of creating duplicate
      // This handles both idempotency retries and genuine duplicate calls
      return {
        sessionId: activeSession.id,
        startedAt: activeSession.startedAt,
        isDuplicate: true,
      };
    }

    // Get today's allowance to link the session
    const today = this.getDateString(new Date(), timezone);
    const allowance = await allowancesRepository.findByUserAndDate(userId, today);

    const session = await usageRepository.createSession(
      userId,
      allowance?.id ?? null,
      input.source as UsageSessionSource
    );

    return {
      sessionId: session.id,
      startedAt: session.startedAt,
      isDuplicate: false,
    };
  }

  async endSession(userId: string, input: EndSessionInput, timezone: string) {
    const session = await usageRepository.findById(input.sessionId);

    // Session must exist
    if (!session) {
      throw Errors.notFound('Usage session');
    }

    // SECURITY: Ownership check - session must belong to this user
    if (session.userId !== userId) {
      throw Errors.forbidden('Not your session');
    }

    // Idempotent: If already ended, return the existing result
    if (session.endedAt) {
      const today = this.getDateString(new Date(), timezone);
      const allowance = await allowancesRepository.findByUserAndDate(userId, today);
      const totalAvailable = (allowance?.earnedMinutes ?? 0) + (allowance?.bonusMinutes ?? 0);
      const realUsed = allowance?.realUsedMinutes ?? 0;
      const remainingMinutes = Math.max(0, totalAvailable - realUsed);

      return {
        sessionId: session.id,
        durationSeconds: session.durationSeconds ?? 0,
        durationMinutes: Math.floor((session.durationSeconds ?? 0) / 60),
        remainingMinutes,
        isDuplicate: true,
      };
    }

    // SECURITY: Calculate duration server-side (never trust client duration)
    const now = new Date();
    const durationSeconds = Math.floor(
      (now.getTime() - session.startedAt.getTime()) / 1000
    );

    // Cap at reasonable maximum (24 hours) to prevent abuse
    const cappedDuration = Math.min(durationSeconds, MAX_SESSION_DURATION_SECONDS);

    // End the session
    const endedSession = await usageRepository.endSession(
      session.id,
      now,
      cappedDuration
    );

    // Update allowance's realUsedMinutes
    const durationMinutes = Math.floor(cappedDuration / 60);
    if (session.allowanceId && durationMinutes > 0) {
      await this.addRealUsedMinutes(session.allowanceId, durationMinutes);
    }

    // Calculate remaining time
    const today = this.getDateString(new Date(), timezone);
    const allowance = await allowancesRepository.findByUserAndDate(userId, today);
    const totalAvailable = (allowance?.earnedMinutes ?? 0) + (allowance?.bonusMinutes ?? 0);
    const realUsed = allowance?.realUsedMinutes ?? 0;
    const remainingMinutes = Math.max(0, totalAvailable - realUsed);

    return {
      sessionId: endedSession.id,
      durationSeconds: cappedDuration,
      durationMinutes,
      remainingMinutes,
      isDuplicate: false,
    };
  }

  async getTodayUsage(userId: string, timezone: string) {
    const today = this.getDateString(new Date(), timezone);
    const startOfDay = new Date(`${today}T00:00:00Z`);
    const endOfDay = new Date(`${today}T23:59:59Z`);

    const sessions = await usageRepository.findTodaySessions(userId, startOfDay, endOfDay);
    const totalSeconds = await usageRepository.sumTodayUsage(userId, startOfDay, endOfDay);
    const totalMinutes = Math.floor(totalSeconds / 60);

    return {
      totalMinutes,
      totalSeconds,
      sessions: sessions.map((s) => ({
        id: s.id,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationSeconds: s.durationSeconds,
        source: s.source,
      })),
    };
  }

  async getActiveSession(userId: string) {
    return usageRepository.findActiveSession(userId);
  }

  private async addRealUsedMinutes(allowanceId: string, minutes: number) {
    // Get current allowance
    const allowance = await this.findAllowanceById(allowanceId);
    if (!allowance) return;

    // Update realUsedMinutes
    const newRealUsed = (allowance.realUsedMinutes ?? 0) + minutes;
    await this.updateAllowanceRealUsed(allowanceId, newRealUsed);
  }

  private async findAllowanceById(id: string) {
    // Direct DB query since we need to find by ID, not user+date
    const { db } = await import('@/db');
    const { allowances } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    return db.query.allowances.findFirst({
      where: eq(allowances.id, id),
    });
  }

  private async updateAllowanceRealUsed(id: string, realUsedMinutes: number) {
    const { db } = await import('@/db');
    const { allowances } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await db
      .update(allowances)
      .set({ realUsedMinutes, updatedAt: new Date() })
      .where(eq(allowances.id, id));
  }

  private getDateString(date: Date, timezone: string): string {
    return date.toLocaleDateString('en-CA', { timeZone: timezone }); // Returns YYYY-MM-DD
  }
}

export const usageService = new UsageService();
