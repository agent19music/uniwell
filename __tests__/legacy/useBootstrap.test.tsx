import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Use the path alias to match app imports
jest.mock('@/lib/supabase', () => require('../__mocks__/@/lib/supabase'))
jest.mock('@react-native-async-storage/async-storage')

import { useBootstrap, RemoteConfig } from '@/hooks/useBootstrap'

// Helpers
function flushAllPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

describe('useBootstrap', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Reset AsyncStorage mock store
    await (AsyncStorage as any).clear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('fast path: authenticated session resolves to app quickly', async () => {
    const { supabase } = jest.requireMock('../__mocks__/@/lib/supabase')
    // Supabase has a session
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } }, error: null })

    const remoteConfig: RemoteConfig = {}

    const { result } = renderHook(() =>
      useBootstrap({
        cachedAuth: { hasSession: true, userId: 'u1' },
        isFirstRun: false,
        remoteConfig,
      })
    )

    // Let promises resolve
    await act(async () => {
      await flushAllPromises()
      jest.advanceTimersByTime(10)
    })

    await expect(result.current.promise).resolves.toEqual({ screen: 'app', reason: 'authenticated' })
    expect(result.current.status.current).toBe('success')
    expect(result.current.hardTimedOut.current).toBe(false)
  })

  test('slow remote config: resolves on soft timeout with partial info (<5s)', async () => {
    jest.useFakeTimers()

    const { supabase } = jest.requireMock('../__mocks__/@/lib/supabase')
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })

    // Storage indicates onboarding completed
    await AsyncStorage.setItem('onboarding_completed', 'true')

    // Remote config that resolves after 4s (past soft 2s, before hard 5s)
    const remoteConfig = async () => {
      await new Promise((r) => setTimeout(r, 4000))
      return {}
    }

    const { result } = renderHook(() =>
      useBootstrap({
        cachedAuth: { hasSession: false },
        isFirstRun: false,
        remoteConfig,
      })
    )

    // Advance to just after soft timeout
    await act(async () => {
      jest.advanceTimersByTime(2100)
      await flushAllPromises()
    })

    const resolved = await result.current.promise
    expect(['app', 'onboarding']).toContain(resolved.screen)
    // With onboarding_completed=true, partial decision should be app
    expect(resolved).toEqual({ screen: 'app', reason: 'onboarding_completed_or_stored_users' })
    expect(result.current.hardTimedOut.current).toBe(false)
  })

  test('failure in remote config: falls back to onboarding with config_error', async () => {
    const { supabase } = jest.requireMock('../__mocks__/@/lib/supabase')
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })

    const remoteConfig = async () => {
      throw new Error('config failed')
    }

    const { result } = renderHook(() =>
      useBootstrap({
        cachedAuth: { hasSession: false },
        isFirstRun: false,
        remoteConfig,
      })
    )

    // Allow effect to run and timers to progress a bit
    await act(async () => {
      await flushAllPromises()
      jest.advanceTimersByTime(10)
    })

    await expect(result.current.promise).resolves.toEqual({ screen: 'onboarding', reason: 'config_error' })
    expect(result.current.status.current).toBe('error')
  })
})
