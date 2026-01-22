import { blockedAppsRepository } from './blocked-apps.repository';
import { Errors } from '@/lib/errors';
import type { CreateBlockedAppsInput, UpdateBlockedAppsInput } from './blocked-apps.schemas';
import type { BlockedApp } from '@/db/schema';

const COOLDOWN_HOURS = 24;

// Response type (excludes sensitive selectionData)
interface BlockedAppsResponse {
  id: string;
  selectionId: string;
  appCount: number;
  categoryCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasPendingChanges: boolean;
  pendingAppCount: number | null;
  pendingCategoryCount: number | null;
  pendingIsActive: boolean | null;
  pendingAppliesAt: string | null;
}

class BlockedAppsService {
  private getCooldownAppliesAt(): Date {
    return new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000);
  }

  private formatResponse(blockedApps: BlockedApp | null | undefined): BlockedAppsResponse | null {
    if (!blockedApps) return null;

    return {
      id: blockedApps.id,
      selectionId: blockedApps.selectionId,
      appCount: blockedApps.appCount,
      categoryCount: blockedApps.categoryCount,
      isActive: blockedApps.isActive,
      createdAt: blockedApps.createdAt.toISOString(),
      updatedAt: blockedApps.updatedAt.toISOString(),
      hasPendingChanges: blockedApps.pendingAppliesAt !== null,
      pendingAppCount: blockedApps.pendingAppCount,
      pendingCategoryCount: blockedApps.pendingCategoryCount,
      pendingIsActive: blockedApps.pendingIsActive,
      pendingAppliesAt: blockedApps.pendingAppliesAt?.toISOString() ?? null,
    };
  }

  async getBlockedApps(userId: string) {
    const blockedApps = await blockedAppsRepository.findByUser(userId);
    return this.formatResponse(blockedApps);
  }

  async getBlockedAppsWithSelectionData(userId: string) {
    // Internal use only - includes selection data for enforcement
    return blockedAppsRepository.findByUser(userId);
  }

  async createOrUpdateBlockedApps(userId: string, input: CreateBlockedAppsInput) {
    const existing = await blockedAppsRepository.findByUser(userId);

    // No existing → create immediately
    if (!existing) {
      const created = await blockedAppsRepository.create(userId, {
        selectionData: input.selectionData,
        selectionId: input.selectionId,
        appCount: input.appCount,
        categoryCount: input.categoryCount,
        isActive: true,
      });
      return this.formatResponse(created);
    }

    // Has pending → reject
    if (existing.pendingAppliesAt !== null) {
      throw Errors.validation({ pending: ['Cancel pending changes first'] });
    }

    // Adding apps (or same count) → immediate
    if (input.appCount >= existing.appCount) {
      const updated = await blockedAppsRepository.update(existing.id, {
        selectionData: input.selectionData,
        selectionId: input.selectionId,
        appCount: input.appCount,
        categoryCount: input.categoryCount,
      });
      return this.formatResponse(updated);
    }

    // Removing apps → cooldown
    const updated = await blockedAppsRepository.setPending(
      userId,
      {
        selectionData: input.selectionData,
        appCount: input.appCount,
        categoryCount: input.categoryCount,
      },
      this.getCooldownAppliesAt()
    );
    return this.formatResponse(updated);
  }

  async updateBlockedApps(userId: string, input: UpdateBlockedAppsInput) {
    const existing = await blockedAppsRepository.findByUser(userId);

    if (!existing) {
      throw Errors.notFound('Blocked apps configuration');
    }

    if (existing.pendingAppliesAt !== null) {
      throw Errors.validation({ pending: ['Cancel pending changes first'] });
    }

    // Enabling → immediate
    if (input.isActive && !existing.isActive) {
      const updated = await blockedAppsRepository.update(existing.id, { isActive: true });
      return this.formatResponse(updated);
    }

    // Disabling → cooldown
    if (!input.isActive && existing.isActive) {
      const updated = await blockedAppsRepository.setPending(
        userId,
        { isActive: false },
        this.getCooldownAppliesAt()
      );
      return this.formatResponse(updated);
    }

    // No change
    return this.formatResponse(existing);
  }

  async cancelPendingChanges(userId: string) {
    const existing = await blockedAppsRepository.findByUser(userId);

    if (!existing) {
      throw Errors.notFound('Blocked apps configuration');
    }

    if (!existing.pendingAppliesAt) {
      throw Errors.validation({ pending: ['No pending changes to cancel'] });
    }

    const updated = await blockedAppsRepository.clearPending(userId);
    return this.formatResponse(updated);
  }

  async deleteBlockedApps(userId: string) {
    const existing = await blockedAppsRepository.findByUser(userId);

    if (!existing) {
      throw Errors.notFound('Blocked apps configuration');
    }

    await blockedAppsRepository.delete(userId);

    return { deleted: true };
  }

  async hasBlockedApps(userId: string): Promise<boolean> {
    const blockedApps = await blockedAppsRepository.findByUser(userId);
    return blockedApps !== null && blockedApps !== undefined;
  }

  async isEnforcementActive(userId: string): Promise<boolean> {
    const blockedApps = await blockedAppsRepository.findByUser(userId);
    return blockedApps?.isActive ?? false;
  }
}

export const blockedAppsService = new BlockedAppsService();
