# Startup gates: Onboarding vs Main Shell

This document inventories every place the app decides whether to show onboarding or the main application shell, including navigation guards, storage reads/writes, and session checks. It also notes where onboarding is explicitly or implicitly completed.

Overview
- The central gate is provided by OnboardingRoot + OnboardingScreenWithChildren, which use OnboardingContext to choose onboarding vs. main app content.
- Additional guards/redirects exist in AuthContext (useProtectedRoute) and the landing page (app/index.tsx).
- Onboarding may be completed explicitly (skipOnboarding) or implicitly (detecting session/stored users).

Async/persistent keys and session signals
- AsyncStorage keys
  - 'onboarding_completed' (string 'true'|'false')
    - Readers: app/_layout.tsx (AppContainer), app/onboarding/OnboardingContext.tsx (OnboardingProvider)
    - Writers: app/_layout.tsx (AppContainer), app/onboarding/OnboardingContext.tsx (OnboardingProvider via skip or stored users), app/onboarding/index.tsx (OnboardingRoot when session token exists)
  - 'uniwell_stored_users' (JSON array)
    - Readers: app/onboarding/OnboardingContext.tsx, contexts/AuthContext.tsx (two places: guard hook and provider), app/index.tsx (via useAuth)
    - Writers: contexts/AuthContext.tsx (add/remove/clear stored users)
  - 'supabase.auth.token'
    - Reader: app/onboarding/index.tsx (OnboardingRoot) – existence is treated as an active session, triggers 'onboarding_completed' = 'true'
- Supabase auth session
  - Checked in multiple places (AuthContext listener, app/index.tsx landing, and inferred via 'supabase.auth.token') to route user into the app and implicitly mark onboarding complete.

Decision points (file, function/component, condition → action)
1) app/_layout.tsx
- AppContainer
  - Condition: Read 'onboarding_completed'. If storedUsers.length > 0 (from useAuth) or session exists → set 'onboarding_completed' = 'true'.
  - Action: Wrap children in <OnboardingRoot>. This wrapper will decide to show onboarding vs. children. Calls onInitializationComplete when checks finish.
- RootLayout
  - Condition: Waits for fonts + AppContainer initialization before rendering Stack.
  - Action: Renders Stack with routes. Actual onboarding gating is delegated to AppContainer + OnboardingRoot.

2) app/onboarding/index.tsx
- OnboardingRoot
  - Condition: On mount, check AsyncStorage for 'supabase.auth.token'. If present → write 'onboarding_completed' = 'true'.
  - Action: Provide OnboardingContext and render OnboardingScreenWithChildren.
- OnboardingScreenWithChildren
  - Condition: If isLoading → spinner. If !isFirstTime → render children (i.e., main app). Else → render WebOnboarding or MobileOnboarding.
  - Action: Central gate choosing onboarding vs. app content.

3) app/onboarding/OnboardingContext.tsx
- OnboardingProvider
  - Condition: Read 'onboarding_completed' and 'uniwell_stored_users'. shouldSkipOnboarding = onboarding_completed === 'true' OR hasStoredUsers.
  - Action: Set isFirstTime = !shouldSkipOnboarding. If hasStoredUsers && onboarding_completed !== 'true', write onboarding_completed = 'true'. Exposes skipOnboarding() to explicitly complete onboarding and route away.

4) app/onboarding/MobileOnboarding.tsx
- MobileOnboarding
  - Condition: User advances past last slide.
  - Action: Calls skipOnboarding() → writes 'onboarding_completed' = 'true', sets isFirstTime = false, navigates to '/' (OnboardingContext implementation).

5) app/onboarding/WebOnboarding.tsx
- WebOnboarding
  - Condition: When web onboarding flow completes (e.g., CTA button in flow).
  - Action: Calls skipOnboarding() (same behavior as mobile).

6) contexts/AuthContext.tsx
- useProtectedRoute(session)
  - Conditions/Actions:
    - If !session and current route is not in auth screens and not in ['onboarding', 'profile-completion', 'user-selection'] and not therapist:
      - If storedUsers.length > 0 → router.replace('/user-selection').
      - Else → router.replace('/loginscreen').
    - If session exists and user is on auth screens or 'user-selection' → router.replace('/(tabs)/home').
    - If session exists and user is on 'onboarding' → router.replace('/(tabs)/home').
  - Impact: Can bypass onboarding entirely for authenticated users; routes unauthenticated users to login or user selection unless they explicitly visit onboarding.
- AuthProvider
  - Loads and maintains 'uniwell_stored_users'. Auth state changes drive session and routing decisions used by the guard.

7) app/index.tsx (landing)
- Index
  - Condition: If storedUsers.length > 0 → router.replace('/user-selection'). Else check supabase.auth.getSession() → if session → router.replace('/(tabs)/home').
  - Impact: With prior context, user bypasses onboarding quickly; otherwise stays on landing. Final decision remains with OnboardingRoot wrapper.

8) app/login-callback.tsx (OAuth deep-link handler)
- LoginCallback
  - Condition: After OAuth, if profile missing/incomplete → router.replace('/profile-completion'); else → router.replace('/(tabs)/home').
  - Impact: Not directly onboarding, but logged-in users are routed into the app; combined with OnboardingRoot’s session token check, onboarding is implicitly completed.

Deep links and feature flags
- Deep links: OAuth callback (login-callback.tsx) only. No generic getInitialURL() or custom deep link routing that affects onboarding was found.
- Feature flags: No remote feature-flag checks gating onboarding vs main shell were found.

Implications for merging/cleanup
- Multiple writers to 'onboarding_completed':
  - Explicit: skipOnboarding() from OnboardingContext (mobile/web flows).
  - Implicit: AppContainer (when storedUsers or session exist), OnboardingRoot (when 'supabase.auth.token' exists).
- Multiple independent redirects can route away from onboarding (Auth guard, landing, OAuth callback). Ensure intended precedence and avoid flicker/double redirects.
- Source of truth: Consider consolidating to OnboardingContext as the single authority for onboarding completion, and have other places signal intent (e.g., via context API) rather than writing keys directly.

Quick reference (who decides what)
- Show onboarding vs app: OnboardingScreenWithChildren (uses OnboardingContext state).
- Mark onboarding complete:
  - skipOnboarding() (explicit)
  - AppContainer (session or stored users)
  - OnboardingRoot (supabase token present)
- Redirects that bypass onboarding:
  - Auth guard (useProtectedRoute)
  - Landing (app/index.tsx)
  - OAuth callback → tabs/profile-completion

