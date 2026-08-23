import { roleFromAppMetadata } from '@/lib/auth/roles';

describe('trusted role source', () => {
  it('reads role from app_metadata only', () => {
    expect(roleFromAppMetadata({ role: 'admin' })).toBe('admin');
  });

  it('falls back to user for missing or spoofable values', () => {
    expect(roleFromAppMetadata(undefined)).toBe('user');
    expect(roleFromAppMetadata({ role: 'superadmin' })).toBe('user');
  });
});
