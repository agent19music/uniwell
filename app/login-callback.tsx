import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../hooks/useTheme";
import { ThemedText } from "../components/ThemedText";

/**
 * OAuth Callback Handler
 * This route is automatically triggered by Expo Router when the OAuth redirect happens.
 * Deep link format: uniwell://auth/callback#access_token=...&refresh_token=...
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { handleAuthCallback } = useAuth();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback().catch((err) => {
      setError(err.message || "Authentication failed");
    });
  }, []);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
          padding: 20,
        }}
      >
        <ThemedText
          style={{
            color: "#ef4444",
            fontSize: 16,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {error}
        </ThemedText>
        <ThemedText style={{ color: colors.textSecondary, fontSize: 14 }}>
          Redirecting...
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText style={{ color: colors.textPrimary, marginTop: 20, fontSize: 16 }}>
        Completing sign in...
      </ThemedText>
    </View>
  );
} 