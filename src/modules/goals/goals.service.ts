import { goalsRepository } from './goals.repository';
import { Errors } from '@/lib/errors';
import type { CreateGoalInput, UpdateGoalInput } from './goals.schemas';

class GoalsService {
  async createGoal(userId: string, data: CreateGoalInput) {
    return goalsRepository.create({
      ...data,
      userId,
    });
  }

  async getUserGoals(userId: string, activeOnly = false) {
    return goalsRepository.findByUser(userId, activeOnly);
  }

  async getGoal(userId: string, goalId: string) {
    const goal = await goalsRepository.findById(goalId);

    if (!goal) {
      throw Errors.notFound('Goal');
    }

    if (goal.userId !== userId) {
      throw Errors.forbidden('Not authorized to access this goal');
    }

    return goal;
  }

  async updateGoal(userId: string, goalId: string, data: UpdateGoalInput) {
    const goal = await this.getGoal(userId, goalId);
    return goalsRepository.update(goal.id, data);
  }

  async deleteGoal(userId: string, goalId: string) {
    const goal = await this.getGoal(userId, goalId);
    await goalsRepository.delete(goal.id);
  }

  async getActiveGoals(userId: string) {
    return goalsRepository.findByUser(userId, true);
  }
}

export const goalsService = new GoalsService();
