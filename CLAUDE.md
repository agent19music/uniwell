# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

UniWell is a React Native (Expo Router) student wellness app — mood check-ins, routines/streaks, journals (text/voice/video), an academic timetable (semesters + class schedule), mind games (breathing, sound loops), sleep/wellness dashboards, a community feed, and a personalized library (YouTube/Spotify/News). Backend is Supabase. Targets iOS, Android, and Web.

## Commands

```sh
pnpm start              # expo start
pnpm android / pnpm ios / pnpm web
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint (max 50 warnings; scoped to specific dirs, see package.json)
pnpm format / pnpm format:check
pnpm test               # jest
pnpm test --runInBand   # matches CI
pnpm doctor             # node scripts/ci-doctor.mjs
```

Run a single test file: `pnpm test __tests__/sync-log.test.ts`. Tests under `__tests__/semester/` and `__tests__/legacy/` are excluded from the default jest run (see `testPathIgnorePatterns` in `jest.config.js`).

CI (`.github/workflows/ci.yml`) runs, in order: `typecheck`, `lint`, `format:check`, `test --runInBand`, `doctor`. Run these before considering a change done.

`pnpm doctor` runs `scripts/ci-doctor.mjs`; other one-off scripts: `pnpm update-resources` (refresh library resources), `pnpm start-scheduler` (scheduled resource updates).

## Database: Supabase MCP is the source of truth

When you need table structure, column types, relations, or RLS policies, use the Supabase MCP tools against the live database — do not read or rely on files in `supabase/` (migrations, `config.toml`, `.sql`) to infer schema; they may be stale or conflicting. `types/database.ts` (generated) is the TypeScript contract for table shapes, but for RLS/schema questions or a `PGRST116`/permission error, inspect the live database via MCP.

Every table is expected to have RLS enabled. If standard policies don't cover complex insert logic, look for a `SECURITY DEFINER` Postgres function (inspect existing ones via MCP as examples) rather than relaxing RLS.

## Architecture

### State management: Context only, no Redux

Global state lives in React Context, nested in `app/_layout.tsx` in this order:

```
AuthProvider > CommunityProvider > PostNavigationProvider > MoodProvider > RoutineProvider > SemesterProvider
```

Access via hooks (`useAuth()`, `useMood()`, `useRoutine()`, etc.). `AuthProvider` owns session lifecycle only — roles come from `app_metadata`, not a separate table. `SemesterContext` owns timetables; don't extend `lib/useTimeTableManagement.tsx` further — new timetable logic belongs in `SemesterContext`/`features/semester`.

Server/remote state is on one TanStack Query client (`lib/query`) — feature hooks in `features/*/hooks.ts` call into `features/*/api.ts`. See `.github/adr/0001-query-and-sync.md`.

### Local-first cache + sync (offline)

Two related but distinct layers:

- **`lib/cache/`** — per-domain read caches over AsyncStorage (`ProfileCache`, `MoodCache`, `RoutineCache`, `SemesterCache`, `SleepCache`, `StreakCache`, `JournalCache`), each with its own cache duration / stale-after window (see `lib/cache/README.md`). Pattern: try cache → on miss/stale, fetch from Supabase and repopulate → stale-while-revalidate (return cached data immediately, refresh in background). `cacheManager` (`lib/cache`) initializes/shuts down this system in `app/_layout.tsx` and is warmed up post-login.
- **`lib/sync/`** — the offline write path: a serial mutation log (`mutationLog.ts`) with client-generated UUIDs, enqueued via `enqueue.ts`, drained by `syncWorker.ts`, dispatched to `handlers.ts`. Do not add new write logic to `lib/cache/SyncQueue.ts` — that's legacy; offline writes go through `lib/sync`.

Reads: prefer `lib/cache` before hitting Supabase directly. Writes: go through `lib/sync`.

### Validation & contracts

- `types/database.ts` (generated) is the table contract for shapes.
- `lib/contracts/` validates untrusted input/output (env, forms, JSON, storage, typed errors). Use `parseJson()` from `lib/contracts` instead of raw `JSON.parse` in new code — an ESLint rule warns on this.

### Platform-agnostic UI conventions

- **Toasts**: always `import { toast } from '@/lib/toast'` — never `burnt` or `ToastAndroid` directly. The module resolves per-platform (`index.ios.ts`/`index.android.ts` wrap `burnt`; `index.web.ts` wraps `react-hot-toast`) so native bundles don't pull in web deps.
- **Theming**: use `useTheme()` for colors/dark-mode; the public theme entry is `constants/theme` (compat re-exports live in `constants/Colors.ts` and `hooks/useTheme.ts`). Contrast ratios and motion timings (press 120ms, state 160ms, overlay 240ms; no tab-slide or decorative chart animation) are documented in `DESIGN.md` — keep new UI within those.
- Break large screens into focused, modular components rather than one large screen file.

### Directory map

- `app/` — Expo Router screens/routes (file-based). `app/(tabs)/` is the tab group; `app/onboarding/` is a separate flow with its own `_layout.tsx` and context.
- `contexts/` — the six global providers listed above.
- `features/<domain>/` — `api.ts` (Supabase calls) + `hooks.ts` (TanStack Query hooks) per domain (`community`, `routines`, `mood`, `semester`, `sync`, `journals`, `sleep`).
- `lib/` — `supabase.ts` (+ `.web.ts`/`.native.ts` variants), `cache/`, `sync/`, `query/`, `contracts/`, `auth/`, `mappers/`, `services/` (chat, sleep), `toast/`, plus feature-specific handlers (`ChatSessionHandler.ts`, `NotificationHandler.*`, `spotifyTokenManager.ts`).
- `modals/` — create/edit flow modals.
- `components/` — reusable UI.
- `scripts/` — resource refresh + scheduler scripts (not linted, not typechecked as part of the main app).
- `__tests__/` — Jest tests; `__tests__/integration/` for integration-style tests; `legacy/` and `semester/` subfolders are excluded from default test runs.
- `supabase/` — local migration/config files; treat as historical, not authoritative (see MCP note above).

## Working conventions

- Conventional commits, no emoji (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Don't commit real secrets — copy `.env.example` to `.env` locally. Required env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_PROJECT_ID`. Optional (feature-gated): `EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY`, `EXPO_PUBLIC_YOUTUBE_API_KEY`, `EXPO_PUBLIC_NEWS_API_KEY`, `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`/`SECRET`, `EXPO_PUBLIC_SEGMENT_WRITE_KEY`.
- Don't add throwaway files under `types/`, and don't add raw `JSON.parse` of persisted/untrusted data.
- `package.json` is `"private": true` — not published to npm; the GitHub repo is the contribution surface.
