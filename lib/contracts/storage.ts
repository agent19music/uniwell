import { z } from 'zod';

export const storedUserSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  username: z.string(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  last_login: z.string(),
});

export const storedUsersSchema = z.array(storedUserSchema);

export const cachedAuthSchema = z.object({
  hasSession: z.boolean(),
  userId: z.string().optional(),
});

export const onboardingFlagSchema = z.enum(['true', 'false']);

export type StoredUser = z.infer<typeof storedUserSchema>;
export type CachedAuth = z.infer<typeof cachedAuthSchema>;
