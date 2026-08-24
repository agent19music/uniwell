import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { LockSimple, GoogleLogo, Envelope, Eye, EyeSlash } from 'phosphor-react-native';
import { useTheme } from '../hooks/useTheme';
import { toast } from '@/lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { z } from 'zod';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { DividerLabel, FormSection, InlineNotice } from '@/components/ui/Form';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { BackAction } from '@/components/ui/Navigation';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/theme';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type LoginErrors = Partial<Record<'email' | 'password' | 'form', string>>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signInWithGoogle, googleSignInInProgress } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (loading) return;

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const nextErrors = result.error.flatten().fieldErrors;
      const fieldErrors: LoginErrors = {
        email: nextErrors.email?.[0],
        password: nextErrors.password?.[0],
      };
      setErrors(fieldErrors);
      (fieldErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password,
      });

      if (error) throw error;
      
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Error signing in:', (error as Error).message);
      setErrors({ form: 'We could not sign you in. Check your email and password, then try again.' });
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleSignInInProgress) return;

    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error('Google login error:', error instanceof Error ? error.message : 'Unknown error');
      // Toast is handled in AuthContext for specific errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.content}>
        <BackAction onPress={() => router.back()} />
        <View style={styles.header}>
          <SafeText variant="display">Welcome back</SafeText>
          <SafeText variant="body" color={colors.textSecondary}>Sign in to continue your wellness journey.</SafeText>
        </View>
        <FormSection>
          {errors.form && <InlineNotice>{errors.form}</InlineNotice>}
          <Input ref={emailRef} autoCapitalize="none" autoComplete="email" editable={!loading} error={errors.email} inputMode="email" keyboardType="email-address" label="Email" leading={<Envelope color={colors.textSecondary} size={20} />} onChangeText={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: undefined, form: undefined })); }} placeholder="you@example.com" returnKeyType="next" value={email} onSubmitEditing={() => passwordRef.current?.focus()} />
          <Input ref={passwordRef} autoComplete="current-password" editable={!loading} error={errors.password} label="Password" leading={<LockSimple color={colors.textSecondary} size={20} />} onChangeText={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: undefined, form: undefined })); }} placeholder="Enter your password" returnKeyType="go" secureTextEntry={!showPassword} textContentType="password" value={password} onSubmitEditing={handleLogin} trailing={<IconButton accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} disabled={loading} onPress={() => setShowPassword((visible) => !visible)}><>{showPassword ? <EyeSlash color={colors.textSecondary} size={20} /> : <Eye color={colors.textSecondary} size={20} />}</></IconButton>} />
          <Button label="Forgot password?" onPress={() => router.push('/reset-password')} variant="link" />
          <Button label={loading ? 'Signing in…' : 'Sign in'} loading={loading} onPress={handleLogin} />
          <View style={styles.alternative}>
            <DividerLabel />
          <Button label="Continue with Google" leading={<GoogleLogo color={colors.text} size={20} />} loading={loading || googleSignInInProgress} onPress={handleGoogleLogin} variant="secondary" />
          </View>
        </FormSection>
        <View style={styles.footer}>
          <SafeText variant="body" color={colors.textSecondary}>Don&apos;t have an account?</SafeText>
          <Button label="Sign up" onPress={() => router.push('/signupscreen')} variant="link" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingTop: 0 },
  content: { gap: spacing.field, paddingTop: spacing.field },
  header: {
    gap: spacing.micro,
  },
  alternative: { gap: spacing.field },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.micro,
    alignItems: 'center',
  },
});