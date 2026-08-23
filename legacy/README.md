# Legacy isolates

Throwaway or misfiled prototypes that must not participate in typecheck, lint, or unit tests.

- `journal-prototype.tsx` was previously committed as `types/test.ts` (JSX in a `.ts` type root) and blocked `tsc --noEmit`.
