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
}

export const usersService = new UsersService();
