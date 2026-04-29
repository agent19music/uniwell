import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';

export default function StartScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const handleSignUp = () => {
        // Sign up always routes to onboarding first
        router.push('/onboarding');
    };

    const handleLogin = () => {
        // Login goes directly to login screen
        router.push('/loginscreen');
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top', 'bottom']}
        >
            {/* Background with mesh overlay */}
            <ImageBackground
                source={isDark ? require('../assets/mesh-99dark.png') : require('../assets/mesh-99.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            >
                <View style={[styles.overlay, {
                    backgroundColor: isDark ? 'rgba(28, 24, 21, 0.85)' : 'rgba(254, 253, 251, 0.85)'
                }]} />
            </ImageBackground>

            <View style={styles.content}>
                {/* Hero Section */}
                <View style={styles.hero}>
                    {/* App Icon - No container box */}
                    <Image
                        source={require('../assets/uniwell-logo-removebg.png')}
                        style={styles.appIcon}
                        resizeMode="contain"
                    />

                    {/* App Name */}
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Uniwell
                    </Text>

                    {/* Tagline */}
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Your student wellness companion
                    </Text>
                </View>

                {/* Spacer */}
                <View style={styles.spacer} />

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {/* Sign Up Button - Primary */}
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.primaryButtonText, {
                            color: isDark ? colors.background : '#FFFFFF'
                        }]}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>

                    {/* Log In Button - Secondary */}
                    <TouchableOpacity
                        style={[styles.secondaryButton, {
                            backgroundColor: colors.surface,
                            borderColor: colors.border
                        }]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                            I already have an account
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    hero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appIcon: {
        width: 120,
        height: 120,
        marginBottom: 32,
    },
    title: {
        fontSize: 38,
        fontWeight: '700',
        fontFamily: 'Vercetti-Regular',
        letterSpacing: -0.5,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 17,
        fontFamily: 'SF-Regular',
        lineHeight: 24,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    spacer: {
        flex: 0.3,
    },
    actions: {
        gap: 12,
        paddingBottom: 20,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'SF-Regular',
    },
    secondaryButton: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'SF-Regular',
    },
});
