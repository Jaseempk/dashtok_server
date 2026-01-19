import { Hono } from 'hono';
import { Webhook } from 'svix';
import { env } from '@/config/env';
import { authService } from './auth.service';
import { clerkWebhookSchema } from './auth.schemas';

const authRoutes = new Hono();

// Clerk webhook endpoint
authRoutes.post('/webhook', async (c) => {
  const webhookSecret = env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook not configured' }, 500);
  }

  const payload = await c.req.text();
  const headers = {
    'svix-id': c.req.header('svix-id') || '',
    'svix-timestamp': c.req.header('svix-timestamp') || '',
    'svix-signature': c.req.header('svix-signature') || '',
  };

  // Verify webhook signature
  const wh = new Webhook(webhookSecret);
  let event: unknown;

  try {
    event = wh.verify(payload, headers);
  } catch {
    console.error('Webhook signature verification failed');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Parse and handle the event
  const parsed = clerkWebhookSchema.safeParse(event);

  if (!parsed.success) {
    console.error('Invalid webhook payload:', parsed.error);
    return c.json({ error: 'Invalid payload' }, 400);
  }

  try {
    await authService.handleClerkWebhook(parsed.data);
    return c.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Processing failed' }, 500);
  }
});

export { authRoutes };
