import { db } from '@/db';
import { users, streaks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import type { NewUser } from '@/db/schema';

class AuthRepository {
  async createUser(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning();

    // Also create initial streak record
    await db.insert(streaks).values({
      id: generateId(),
      userId: user.id,
      currentStreak: 0,
      longestStreak: 0,
      multiplier: 1.0,
    });

    return user;
  }

  async findUserById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async updateUser(id: string, data: Partial<NewUser>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const authRepository = new AuthRepository();
