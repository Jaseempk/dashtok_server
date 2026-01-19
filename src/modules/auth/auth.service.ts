import { authRepository } from './auth.repository';
import type { ClerkWebhookPayload } from './auth.schemas';

class AuthService {
  async handleClerkWebhook(payload: ClerkWebhookPayload) {
    const { type, data } = payload;

    switch (type) {
      case 'user.created':
        return this.handleUserCreated(data);
      case 'user.updated':
        return this.handleUserUpdated(data);
      case 'user.deleted':
        return this.handleUserDeleted(data);
      default:
        console.log(`Unhandled webhook type: ${type}`);
        return null;
    }
  }

  private async handleUserCreated(data: ClerkWebhookPayload['data']) {
    const email = data.email_addresses[0]?.email_address;
    if (!email) {
      throw new Error('No email address in webhook payload');
    }

    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    return authRepository.createUser({
      id: data.id,
      email,
      name,
      timezone: 'UTC', // Default, user can update later
      onboardingCompleted: false,
    });
  }

  private async handleUserUpdated(data: ClerkWebhookPayload['data']) {
    const email = data.email_addresses[0]?.email_address;
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    return authRepository.updateUser(data.id, {
      ...(email && { email }),
      ...(name && { name }),
    });
  }

  private async handleUserDeleted(data: ClerkWebhookPayload['data']) {
    await authRepository.deleteUser(data.id);
    return null;
  }

  async ensureUserExists(clerkUserId: string, email: string) {
    const existing = await authRepository.findUserById(clerkUserId);
    if (existing) return existing;

    // Create user if doesn't exist (fallback if webhook missed)
    return authRepository.createUser({
      id: clerkUserId,
      email,
      timezone: 'UTC',
      onboardingCompleted: false,
    });
  }
}

export const authService = new AuthService();
