import { z } from 'zod';

// Response types for enforcement status
export const enforcementReasonSchema = z.enum([
  'goal_incomplete',
  'time_exhausted',
  'unlocked',
  'enforcement_disabled',
  'no_blocked_apps',
]);

export type EnforcementReason = z.infer<typeof enforcementReasonSchema>;

// Enforcement status response
export interface EnforcementStatus {
  shouldBlock: boolean;
  reason: EnforcementReason;
  remainingMinutes: number;
  totalMinutes: number;
  usedMinutes: number;
  nextUnlockRequirement: {
    type: 'distance';
    current: number;
    target: number;
    unit: 'km' | 'miles';
    percentComplete: number;
  } | null;
  emergencyBypassAvailable: boolean;
  emergencyBypassesLeft: number;
  isUnlocked: boolean;
}

// Unlock result
export interface UnlockResult {
  unlocked: boolean;
  reason?: EnforcementReason;
  durationMinutes?: number;
}

// Lock result
export interface LockResult {
  locked: boolean;
}

// Bypass result
export interface BypassResult {
  granted: boolean;
  reason?: 'daily_limit_reached';
  minutesGranted?: number;
  bypassesRemaining?: number;
}
