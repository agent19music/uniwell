export type AppRole = 'user' | 'therapist' | 'admin';

const ROLES: AppRole[] = ['user', 'therapist', 'admin'];

export function roleFromAppMetadata(appMetadata: Record<string, unknown> | undefined): AppRole {
  const value = appMetadata?.role;
  if (typeof value === 'string' && ROLES.includes(value as AppRole)) {
    return value as AppRole;
  }
  return 'user';
}
