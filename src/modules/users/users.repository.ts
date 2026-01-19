import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { NewUser } from '@/db/schema';

class UsersRepository {
  async findById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        streak: true,
      },
    });
  }

  async update(id: string, data: Partial<NewUser>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const usersRepository = new UsersRepository();
