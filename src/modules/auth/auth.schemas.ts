import { z } from 'zod';

// Clerk webhook payload schema
export const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(
      z.object({
        email_address: z.string().email(),
      })
    ),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }),
});

export type ClerkWebhookPayload = z.infer<typeof clerkWebhookSchema>;
