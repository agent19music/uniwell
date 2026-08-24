# Contributing to UniWell

## Setup

1. Copy `.env.example` to `.env`. Never commit real keys.
2. `pnpm install`
3. `pnpm start`

## Quality gates

Run the same commands CI runs:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test --runInBand
pnpm doctor
```

Use conventional commits without emoji (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

## Architecture

- Generated Supabase types in `types/database.ts` are the table contract.
- Validate untrusted input with `lib/contracts`.
- Server state belongs in TanStack Query (`lib/query`) and feature modules (`features/*`).
- Offline writes go through `lib/sync`. Do not add work to `lib/cache/SyncQueue.ts`.
- `AuthProvider` owns session lifecycle only. Roles come from `app_metadata`.
- `SemesterContext` owns timetables. Do not extend `useTimeTableManagement`.

## Pull requests

Use the PR template. Keep PRs focused. Do not add secrets, throwaway files under `types/`, or raw `JSON.parse` of persisted data.
