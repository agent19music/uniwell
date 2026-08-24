import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const signupFormSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    fullName: z.string().trim().min(1, 'Enter your name').optional(),
    gender: z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say']).optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export type LoginForm = z.infer<typeof loginFormSchema>;
export type SignupForm = z.infer<typeof signupFormSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;
