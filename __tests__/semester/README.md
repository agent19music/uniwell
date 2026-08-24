# Manual semester harness

`SemesterTests.tsx` is a manual, in-app test runner — not a Jest suite.

It is excluded from `pnpm test` and `pnpm typecheck` because it:

- imports hooks as if they were local `./lib` modules
- calls React hooks from async helpers
- mutates live Supabase data

Do not add it to CI. Prefer disposable-environment integration tests under `__tests__/integration/` once those exist.
