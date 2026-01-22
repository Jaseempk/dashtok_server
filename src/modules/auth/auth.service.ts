import { authRepository } from './auth.repository';
import type { ClerkWebhookPayload } from './auth.schemas';

class AuthService {
  async handleClerkWebhook(payload: ClerkWebhookPayload) {
    const { type, data } = payload;

    console.log('[Webhook] Received event:', type);
    console.log('[Webhook] Full payload data:', JSON.stringify(data, null, 2));

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
    console.log('[Webhook] handleUserCreated - raw data:', {
      id: data.id,
      email_addresses: data.email_addresses,
      first_name: data.first_name,
      last_name: data.last_name,
    });

    const email = data.email_addresses?.[0]?.email_address;
    if (!email) {
      throw new Error('No email address in webhook payload');
    }

    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    console.log('[Webhook] Creating user with:', { id: data.id, email, name });

    return authRepository.createUser({
      id: data.id,
      email,
      name,
      timezone: 'UTC', // Default, user can update later
      onboardingCompleted: false,
    });
  }

  private async handleUserUpdated(data: ClerkWebhookPayload['data']) {
    const email = data.email_addresses?.[0]?.email_address;
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
