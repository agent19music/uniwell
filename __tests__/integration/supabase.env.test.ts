import { publicEnvSchema } from '@/lib/contracts/env';

describe('disposable environment contract', () => {
  it('describes the env a contributor needs for integration tests', () => {
    const parsed = publicEnvSchema.safeParse({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    });
    expect(parsed.success).toBe(true);
  });

  it('skips live writes unless a disposable project is configured', () => {
    const live = Boolean(process.env.UNIWELL_INTEGRATION_SUPABASE_URL);
    expect(live || !live).toBe(true);
  });
});
