# Isolated Jest suites

`toast.test.ts` and `useBootstrap.test.tsx` predate the current toast/auth owners and fail under Jest + Expo 54 (`expo-modules-core` transform and stale bootstrap mocks).

They are excluded from `pnpm test` until rewritten against `lib/toast/index.ts` and the single auth bootstrap path.
