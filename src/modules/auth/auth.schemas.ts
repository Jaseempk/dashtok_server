import { z } from 'zod';

// Clerk webhook payload schema - flexible to handle different event types
export const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    // User fields - optional since not all events have them
    email_addresses: z.array(
      z.object({
        email_address: z.string().email(),
      })
    ).optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }),
});

export type ClerkWebhookPayload = z.infer<typeof clerkWebhookSchema>;
