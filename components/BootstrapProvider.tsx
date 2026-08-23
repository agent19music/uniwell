import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, useColorScheme, Text, Pressable } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useBootstrap, RemoteConfig } from '@/hooks/useBootstrap'

/** @deprecated Index + AuthStartupGate own bootstrap. Do not mount this provider. */
interface BootstrapProviderProps {
  // Optional remote config loader; if not provided, defaults to no-op config
  remoteConfig?: RemoteConfig | ((signal?: AbortSignal) => Promise<RemoteConfig>)
  // Where to navigate when the decision is 'app'
  mainPath?: string
  // Where to navigate when the decision is 'onboarding'
  onboardingPath?: string
  // Children to render as the app tree; the provider will navigate and overlay a spinner during bootstrap
  children?: React.ReactNode
}

// Internal runner component which is remounted to retry the bootstrap flow
const BootstrapRunner: React.FC<Required<Pick<BootstrapProviderProps, 'remoteConfig' | 'mainPath' | 'onboardingPath'>> & { onRetry: () => void }> = ({
  remoteConfig,
  mainPath,
  onboardingPath,
  onRetry,
}) => {
  const { session, storedUsers } = useAuth()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [firstRunFlag, setFirstRunFlag] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed')
        // If marker missing, treat as first run. If present and 'true', not first run.
        const isFirst = onboardingCompleted !== 'true'
        if (mounted) setFirstRunFlag(isFirst)
      } catch {
        if (mounted) setFirstRunFlag(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const cachedAuth = useMemo(
    () => ({ hasSession: !!session, userId: session?.user?.id ?? null }),
    [session]
  )

  const { status, hardTimedOut, promise } = useBootstrap({
    cachedAuth,
    isFirstRun: firstRunFlag,
    remoteConfig: remoteConfig,
  })

  // Navigate deterministically when the bootstrap resolves
  useEffect(() => {
    let active = true
    promise
      .then((res) => {
        if (!active) return
        if (res.screen === 'onboarding') {
          router.replace(onboardingPath)
        } else {
          router.replace(mainPath)
        }
      })
      .catch(() => {
        if (!active) return
        router.replace(onboardingPath)
      })
    return () => {
      active = false
    }
  }, [promise, router, mainPath, onboardingPath])

  // Render splash while pending, and show retry if we hit hard timeout
  const showRetry = hardTimedOut.current && status.current !== 'loading'

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121212' : '#f5f5f5' },
      ]}
      pointerEvents={showRetry ? 'auto' : 'none'}
    >
      <ActivityIndicator size="large" color={isDark ? '#888888' : '#999999'} />
      {showRetry && (
        <View style={styles.retryWrap}>
          <Text style={[styles.retryText, { color: isDark ? '#e5e5e5' : '#222' }]}> 
            It’s taking longer than expected.
          </Text>
          <Text style={[styles.retrySub, { color: isDark ? '#bdbdbd' : '#555' }]}>You can retry bootstrapping.</Text>
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: isDark ? '#1f1f1f' : '#eaeaea',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ color: isDark ? '#fafafa' : '#111', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

export const BootstrapProvider: React.FC<BootstrapProviderProps> = ({
  remoteConfig,
  mainPath = '/(tabs)/home',
  onboardingPath = '/onboarding',
  children,
}) => {
  // To support retry after a hard timeout we remount the runner by changing its key
  const [runId, setRunId] = useState(0)

  // Default remote config if not supplied
  const loader = useMemo(() => {
    if (!remoteConfig) return (async () => ({} as RemoteConfig)) as (signal?: AbortSignal) => Promise<RemoteConfig>
    return remoteConfig
  }, [remoteConfig])

  return (
    <>
      {children}
      <BootstrapRunner
        key={runId}
        remoteConfig={loader}
        mainPath={mainPath}
        onboardingPath={onboardingPath}
        onRetry={() => setRunId((x) => x + 1)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  retrySub: {
    marginTop: 4,
    fontSize: 14,
  },
})

