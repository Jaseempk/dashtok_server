import type { Context } from 'hono';

// Variables that can be set on the Hono context
export type Variables = {
  userId: string;
  userEmail: string;
};

// Authenticated context type
export type AuthContext = {
  Variables: Variables;
};

// Helper to get typed context
export type AppContext = Context<AuthContext>;
