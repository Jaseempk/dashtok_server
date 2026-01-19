import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import { Errors } from '@/lib/errors';

// Wrapper around zValidator that throws AppError on validation failure
export const validate = {
  json: <T extends ZodSchema>(schema: T) =>
    zValidator('json', schema, (result, c) => {
      if (!result.success) {
        throw Errors.validation(result.error.flatten());
      }
    }),

  query: <T extends ZodSchema>(schema: T) =>
    zValidator('query', schema, (result, c) => {
      if (!result.success) {
        throw Errors.validation(result.error.flatten());
      }
    }),

  param: <T extends ZodSchema>(schema: T) =>
    zValidator('param', schema, (result, c) => {
      if (!result.success) {
        throw Errors.validation(result.error.flatten());
      }
    }),
};
