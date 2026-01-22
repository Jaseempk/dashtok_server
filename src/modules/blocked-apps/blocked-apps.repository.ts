import { db } from '@/db';
import { blockedApps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { NewBlockedApp, BlockedApp } from '@/db/schema';

// Constant for clearing all pending fields
const CLEAR_PENDING_FIELDS = {
  pendingSelectionData: null,
  pendingAppCount: null,
  pendingCategoryCount: null,
  pendingIsActive: null,
  pendingAppliesAt: null,
} as const;

class BlockedAppsRepository {
  // Raw find - no auto-apply (internal use)
  private async findByUserRaw(userId: string) {
    return db.query.blockedApps.findFirst({
      where: eq(blockedApps.userId, userId),
    });
  }

  // Public find - auto-applies pending if due
  async findByUser(userId: string) {
    const record = await this.findByUserRaw(userId);

    if (record?.pendingAppliesAt && record.pendingAppliesAt <= new Date()) {
      return this.applyPending(record);
    }

    return record;
  }

  async create(userId: string, data: Omit<NewBlockedApp, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const [created] = await db
      .insert(blockedApps)
      .values({
        id: generateId(),
        userId,
        selectionData: data.selectionData,
        selectionId: data.selectionId,
        appCount: data.appCount ?? 0,
        categoryCount: data.categoryCount ?? 0,
        isActive: data.isActive ?? true,
      })
      .returning();

    return created;
  }

  async update(id: string, data: Partial<NewBlockedApp>) {
    const [updated] = await db
      .update(blockedApps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blockedApps.id, id))
      .returning();

    return updated;
  }

  async upsert(userId: string, data: Omit<NewBlockedApp, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    const existing = await this.findByUser(userId);

    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create(userId, data);
  }

  async delete(userId: string) {
    const [deleted] = await db
      .delete(blockedApps)
      .where(eq(blockedApps.userId, userId))
      .returning();

    return deleted;
  }

  async updateIsActive(userId: string, isActive: boolean) {
    const existing = await this.findByUser(userId);
    if (!existing) return null;

    return this.update(existing.id, { isActive });
  }

  // Set any pending changes (unified method)
  async setPending(
    userId: string,
    pending: {
      selectionData?: string;
      appCount?: number;
      categoryCount?: number;
      isActive?: boolean;
    },
    appliesAt: Date
  ) {
    const existing = await this.findByUserRaw(userId);
    if (!existing) return null;

    const updates: Record<string, unknown> = { pendingAppliesAt: appliesAt };

    if (pending.selectionData !== undefined) {
      updates.pendingSelectionData = pending.selectionData;
      updates.pendingAppCount = pending.appCount;
      updates.pendingCategoryCount = pending.categoryCount;
    }

    if (pending.isActive !== undefined) {
      updates.pendingIsActive = pending.isActive;
    }

    return this.update(existing.id, updates);
  }

  // Clear pending changes
  async clearPending(userId: string) {
    const existing = await this.findByUserRaw(userId);
    if (!existing) return null;
    return this.update(existing.id, CLEAR_PENDING_FIELDS);
  }

  // Apply pending changes (uses already-fetched record)
  private async applyPending(existing: BlockedApp) {
    const updates: Record<string, unknown> = { ...CLEAR_PENDING_FIELDS };

    if (existing.pendingSelectionData !== null) {
      updates.selectionData = existing.pendingSelectionData;
      updates.appCount = existing.pendingAppCount ?? 0;
      updates.categoryCount = existing.pendingCategoryCount ?? 0;
    }

    if (existing.pendingIsActive !== null) {
      updates.isActive = existing.pendingIsActive;
    }

    return this.update(existing.id, updates);
  }
}

export const blockedAppsRepository = new BlockedAppsRepository();
