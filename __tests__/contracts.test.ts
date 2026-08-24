import { loginFormSchema, parseJson, signupFormSchema } from '@/lib/contracts';

describe('boundary contracts', () => {
  it('accepts a valid login form', () => {
    expect(loginFormSchema.parse({ email: 'ada@uniwell.app', password: 'secret' })).toEqual({
      email: 'ada@uniwell.app',
      password: 'secret',
    });
  });

  it('rejects an invalid login email', () => {
    expect(() => loginFormSchema.parse({ email: 'not-an-email', password: 'secret' })).toThrow();
  });

  it('requires matching signup passwords', () => {
    expect(() =>
      signupFormSchema.parse({
        email: 'ada@uniwell.app',
        password: 'password1',
        confirmPassword: 'password2',
      }),
    ).toThrow();
  });

  it('recovers from corrupt persisted JSON', () => {
    const result = parseJson('{"broken"', (value) => value, 'cache');
    expect(result.ok).toBe(false);
  });

  it('parses trusted persisted JSON', () => {
    const result = parseJson('{"id":"1"}', (value) => value as { id: string }, 'cache');
    expect(result).toEqual({ ok: true, data: { id: '1' } });
  });
});
