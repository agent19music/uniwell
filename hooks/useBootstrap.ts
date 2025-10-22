import { useEffect, useMemo, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

export type BootstrapScreen = 'onboarding' | 'app'

export type BootstrapReason =
  | 'first_run'
  | 'no_session'
  | 'config_force_onboarding'
  | 'authenticated'
  | 'config_error'
  | 'unknown'

export type BootstrapStatus = 'idle' | 'loading' | 'success' | 'error'

export interface CachedAuthState {
  // Whether a user session exists from cache (e.g., Supabase session, token, etc.)
  hasSession: boolean
  // Optional: user id or other metadata if you need to branch further
  userId?: string | null
}

export interface RemoteConfig {
  // Example flag that could force onboarding even if authenticated
  forceOnboarding?: boolean
  // Example minimum app version enforcement, etc.
  minVersion?: string
  // Add additional config as needed
  [key: string]: unknown
}

export type RemoteConfigInput =
  | RemoteConfig
  | ((signal?: AbortSignal) => Promise<RemoteConfig>)

export interface UseBootstrapInput {
  cachedAuth: CachedAuthState | null
  isFirstRun: boolean
  remoteConfig: RemoteConfigInput
  // Optional: how long to wait for remote config before deciding based on cached inputs
  configTimeoutMs?: number
}

export interface BootstrapResult {
  screen: BootstrapScreen
  reason: string
}

export interface UseBootstrapReturn {
  // Status ref for splash indicator rendering
  status: React.MutableRefObject<BootstrapStatus>
  // True if the hard timeout path fired for this hook invocation
  hardTimedOut: React.MutableRefObject<boolean>
  // Promise that resolves with the bootstrap decision
  promise: Promise<BootstrapResult>
}

/**
 * useBootstrap
 *
 * Unified bootstrap hook that evaluates app entry screen and provides a status ref
 * for rendering a splash while resolution is in progress.
 *
 * Contract:
 * - Returns a promise resolving to { screen: 'onboarding' | 'app', reason: string }
 * - Exposes a status ref: 'idle' | 'loading' | 'success' | 'error'
 * - Inputs: cached auth state, first-run flag, remote config (object or async loader)
 */
export function useBootstrap(input: UseBootstrapInput): UseBootstrapReturn {
  const { cachedAuth, isFirstRun, remoteConfig } = input

  const status = useRef<BootstrapStatus>('idle')
  const hardTimedOut = useRef<boolean>(false)
  const startedRef = useRef(false)
  const resolveRef = useRef<(v: BootstrapResult) => void>()
  const rejectRef = useRef<(e: unknown) => void>()

  // Create a stable promise instance whose resolution we control
  const promise = useMemo<Promise<BootstrapResult>>(() => {
    return new Promise<BootstrapResult>((resolve, reject) => {
      resolveRef.current = resolve
      rejectRef.current = reject
    })
    // Only create once; we manually resolve/reject
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Core decision logic
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    status.current = 'loading'
    let finished = false

    // Analytics: mark the start and base timestamp
    const t0 = Date.now()
    ;(async () => {
      try {
        const { track } = await import('../lib/analytics')
        track('bootstrap_start', {
          ts: new Date(t0).toISOString(),
        })
      } catch {}
    })()

    const complete = (result: BootstrapResult) => {
      if (finished) return
      finished = true
      clearTimeout(softTimer)
      clearTimeout(hardTimer)
      try {
        remoteAbort.abort('bootstrap_complete')
      } catch {}
      status.current = 'success'
      resolveRef.current?.(result)
    }

    const fail = (err: unknown) => {
      if (finished) return
      finished = true
      clearTimeout(softTimer)
      clearTimeout(hardTimer)
      try {
        remoteAbort.abort('bootstrap_error')
      } catch {}
      status.current = 'error'
      // Resolve to onboarding for safety; also reject for logging
      resolveRef.current?.({ screen: 'onboarding', reason: 'config_error' })
      rejectRef.current?.(err)
    }

    // AbortController for remote config (and any fetches that support AbortSignal)
    const remoteAbort = new AbortController()

    // Shared state for partial decisions
    type StorageSnapshot = {
      onboardingCompleted?: boolean
      hasStoredUsers?: boolean
    }
    let storage: StorageSnapshot | null = null
    let sessionKnown = false
    let hasSession = false
    let configKnown = false
    let cfg: RemoteConfig | null = null

    // Kick off all checks in parallel
    const storagePromise = (async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          'onboarding_completed',
          'uniwell_stored_users',
        ])
        const map = Object.fromEntries(entries)
        storage = {
          onboardingCompleted: map['onboarding_completed'] === 'true',
          hasStoredUsers: (() => {
            try {
              const raw = map['uniwell_stored_users']
              if (!raw) return false
              const arr = JSON.parse(raw)
              return Array.isArray(arr) && arr.length > 0
            } catch {
              return false
            }
          })(),
        }
      } catch {
        storage = { onboardingCompleted: undefined, hasStoredUsers: undefined }
      }
    })()

    const sessionPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        hasSession = !!data?.session
        sessionKnown = true
      } catch {
        hasSession = false
        sessionKnown = true
      }
    })()

    const configPromise = (async () => {
      try {
        if (typeof remoteConfig === 'function') {
          cfg = await remoteConfig(remoteAbort.signal)
        } else {
          cfg = remoteConfig
        }
        configKnown = true
      } catch (e) {
        if ((e as any)?.name === 'AbortError') {
          // Swallow abort
        } else {
          configKnown = true // treat as known but failed, we can decide conservatively
          cfg = null
        }
      }
    })()

    // Helper to decide with whatever we know
    const decide = (): BootstrapResult => {
      // 1) First run wins
      if (isFirstRun) return { screen: 'onboarding', reason: 'first_run' }

      // 2) Remote force flag (if known and true)
      if (configKnown && cfg?.forceOnboarding) {
        return { screen: 'onboarding', reason: 'config_force_onboarding' }
      }

      // 3) If we know session state
      if (sessionKnown) {
        if (hasSession) return { screen: 'app', reason: 'authenticated' }
        // if we know there is no session and no force flag, fall back to storage
        if (storage?.onboardingCompleted || storage?.hasStoredUsers) {
          return { screen: 'app', reason: 'onboarding_completed_or_stored_users' }
        }
        return { screen: 'onboarding', reason: 'no_session' }
      }

      // 4) If we don't know session yet, but storage indicates completion/users
      if (storage?.onboardingCompleted || storage?.hasStoredUsers) {
        return { screen: 'app', reason: 'onboarding_completed_or_stored_users' }
      }

      // 5) Conservative default
      return { screen: 'onboarding', reason: 'unknown' }
    }

    // When everything finishes before soft deadline, complete early
    const allDone = Promise.allSettled([storagePromise, sessionPromise, configPromise]).then(
      () => {
        if (!finished) complete(decide())
      }
    )

    // 2s soft deadline: decide with partial data
    const softTimer = setTimeout(() => {
      try {
        ;(async () => {
          try {
            const { track } = await import('../lib/analytics')
            track('bootstrap_soft_timeout', {
              duration_ms: Date.now() - t0,
            })
          } catch {}
        })()
      } catch {}
      if (!finished) complete(decide())
    }, 1000) // Reduced from 2000ms to 1000ms

// 3s hard failover: abort lingering tasks and decide
    const hardTimer = setTimeout(() => {
      try {
        hardTimedOut.current = true
        remoteAbort.abort('hard_timeout')
      } catch {}
      try {
        ;(async () => {
          try {
            const { track } = await import('../lib/analytics')
            track('bootstrap_hard_timeout', {
              duration_ms: Date.now() - t0,
            })
          } catch {}
        })()
      } catch {}
      if (!finished) complete(decide())
    }, 3000) // Reduced from 5000ms to 3000ms

    // Safety: handle unexpected exceptions in the parallel tasks
    allDone.catch(fail)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, hardTimedOut, promise }
}

/**
Example usage:

const { status, promise } = useBootstrap({
  cachedAuth: { hasSession: !!session, userId: session?.user?.id },
  isFirstRun: firstRunFlag,
  remoteConfig: async () => await fetchRemoteConfig(),
})

useEffect(() => {
  let mounted = true
  promise.then((res) => {
    if (!mounted) return
    if (res.screen === 'onboarding') navigate('Onboarding')
    else navigate('AppRoot')
  })
  return () => {
    mounted = false
  }
}, [promise])

// In your splash component
// status.current === 'loading' -> show spinner
*/
