import { usersRepository } from './users.repository';
import { Errors } from '@/lib/errors';
import type { UpdateUserInput } from './users.schemas';

class UsersService {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw Errors.notFound('User');
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateUserInput) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw Errors.notFound('User');
    }

    return usersRepository.update(userId, data);
  }

  async deleteAccount(userId: string) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw Errors.notFound('User');
    }

    await usersRepository.delete(userId);
  }

  /**
   * Register push token for a user
   * Server validates token format before storing
   */
  async registerPushToken(userId: string, token: string) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw Errors.notFound('User');
    }

    // Store the token - validation already done by schema
    await usersRepository.update(userId, {
      pushToken: token,
      notificationsEnabled: true,
    });

    return { registered: true };
  }

  /**
   * Remove push token for a user (logout/disable notifications)
   */
  async removePushToken(userId: string) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw Errors.notFound('User');
    }

    await usersRepository.update(userId, {
      pushToken: null,
      notificationsEnabled: false,
    });

    return { removed: true };
  }
}

export const usersService = new UsersService();
