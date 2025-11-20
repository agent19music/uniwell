
# UniWell - AI Agent Instructions

## ⚠️ CRITICAL: DATABASE SOURCE OF TRUTH

**Strict Compliance Required:**

1.  **SUPABASE MCP ONLY:** When you need to check database structure, table definitions, column types, relations, or RLS policies, you must **exclusively** use the Supabase MCP tools to query the live database.
2.  **IGNORE LOCAL FILES:** **Do not** read, parse, or rely on files within the local `supabase/` directory (e.g., `migrations/`, `config.toml`, or `.sql` files) to understand the schema. These files may be outdated or conflicting.
3.  **VERIFY RLS:** If a database error occurs, use the MCP to inspect the live RLS policies on the table immediately.

-----

## Project Overview

UniWell is a React Native (Expo) wellness app with a Supabase backend, targeting iOS, Android, and Web. It tracks student wellness (routines, moods, sleep, journaling, academic schedules).

## Architecture Essentials

### 1\. Context-Driven State Management

  * **No Redux:** All global state uses React Context.
  * **Provider Nesting:** Ensure providers are nested correctly in `app/_layout.tsx`:
    ```tsx
    <AuthProvider>
      <CommunityProvider>
        <PostNavigationProvider>
          <MoodProvider>
            <RoutineProvider>
              <SemesterProvider>
    ```
  * **Usage:** Access state via hooks (e.g., `useAuth()`, `useMood()`, `useRoutine()`).

### 2\. Local-First Caching System

**Goal:** Reduce Supabase calls by 80-90%.
**Pattern:** Always use services in `lib/cache/` (`profileCache`, `moodCache`, `routineCache`, etc.).

**Implementation Pattern:**

```tsx
// 1. Try cache first
let data = await profileCache.getProfile(userId);

// 2. If miss, fetch from Supabase and cache it
if (!data) {
  const { data: freshData } = await supabase.from('profiles').select('*');
  await profileCache.setProfile(userId, freshData);
  data = freshData;
}

// 3. Stale-while-revalidate logic
if (status === 'stale') {
  // Return cached data immediately, refresh in background
  supabase.from('profiles').select('*').then(({ data }) => {
    profileCache.setProfile(userId, data);
  });
}
```

### 3\. Platform-Agnostic UI

  * **Toasts:** **ALWAYS** import from `@/lib/toast`. Never use platform-specific libraries like `burnt` or `ToastAndroid` directly.
    ```tsx
    import { toast } from '@/lib/toast';
    toast.success('Success!');
    ```
  * **Theming:** Use the `useTheme` hook for colors.
    ```tsx
    const { colors, isDark } = useTheme();
    ```
  * **Components:** Break large screens into focused, modular components (e.g., `ScheduleHeader`, `TimeGrid`).

## Database & RLS Patterns

### Row-Level Security (RLS)

  * **Strict Enforcement:** Every table must have RLS enabled.
  * **Complex Inserts:** If standard RLS policies fail for complex logic, use `SECURITY DEFINER` PostgreSQL functions (inspect existing functions via MCP for examples).
  * **Common Errors:** If you encounter a `PGRST116` or permission error, use the MCP to verify that an `INSERT`/`SELECT` policy exists for the specific user role.

## Development Workflows

### Coding Standards

1.  **Imports:** Ensure `ScrollView`, `View`, `Text` are imported from `react-native`.
2.  **Types:** Always define explicit interfaces for component props. Check `types/` directory for shared types (e.g., `TimetableTypes.ts`, `community.ts`).
3.  **File Structure:**
      * `app/` -\> Expo Router screens.
      * `contexts/` -\> Global state logic.
      * `lib/cache/` -\> Data caching layer.
      * `components/` -\> Reusable UI.

### Troubleshooting Guide

  * **RLS Error?** -\> Call Supabase MCP to check policies.
  * **Context Error?** -\> Check Provider nesting in `app/_layout.tsx`.
  * **UI Crash?** -\> Check for missing React Native imports or platform-specific code running on Web.

-----

**End of Instructions**

