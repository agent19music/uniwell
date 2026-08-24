export class AppError extends Error {
  readonly code: string;
  readonly recoverable: boolean;

  constructor(message: string, code = 'unknown', recoverable = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

export function toAppError(error: unknown, fallback = 'Something went wrong'): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message);
  return new AppError(fallback);
}

export function mapAuthError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Invalid login credentials')) {
    return new AppError('Email or password is incorrect', 'invalid_credentials');
  }
  if (message.includes('Email not confirmed')) {
    return new AppError('Confirm your email before signing in', 'email_unconfirmed');
  }
  if (message.includes('User already registered')) {
    return new AppError('An account with this email already exists', 'user_exists');
  }
  return new AppError(message || 'Unable to complete sign-in', 'auth');
}
