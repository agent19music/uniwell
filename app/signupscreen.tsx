import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import { Envelope, Eye, EyeSlash, GenderFemale, GenderMale, GenderNeuter, GoogleLogo, LockSimple, User } from 'phosphor-react-native';

import CustomDialog from '../components/CustomDialog';
import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { DividerLabel, FormSection, InlineNotice } from '@/components/ui/Form';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { BackAction } from '@/components/ui/Navigation';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';

const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Choose an option or select prefer not to say.' }) }),
});

type Gender = 'male' | 'female' | 'other' | '';
type SignUpErrors = Partial<Record<'name' | 'email' | 'password' | 'gender' | 'form', string>>;

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { signInWithGoogle, googleSignInInProgress } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function requestNotificationPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return false;

      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '577b2274-9c11-4801-af8d-a12055a11673',
      });
      return true;
    } catch (error) {
      console.warn('Error requesting notification permissions:', error);
      return false;
    }
  }

  async function handleSignUp() {
    if (loading || googleSignInInProgress) return;

    const result = signUpSchema.safeParse({ name, email, password, gender });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const nextErrors: SignUpErrors = {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        gender: fieldErrors.gender?.[0],
      };
      setErrors(nextErrors);
      if (nextErrors.name) nameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await requestNotificationPermissions();
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: { data: { full_name: result.data.name, gender: result.data.gender } },
      });
      if (error) throw error;

      if (data.user) {
        const avatarUrl = result.data.gender === 'male'
          ? 'https://www.tapback.co/api/avatar/user55?color=3'
          : 'https://www.tapback.co/api/avatar/Ccd8b9';
        const { error: profileError } = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
        if (profileError) throw profileError;
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          avatar_url: avatarUrl,
          gender: result.data.gender,
          profile_completion_percentage: 40,
          full_name: result.data.name,
          updated_at: new Date(),
        });
        if (upsertError) throw upsertError;
        await supabase.from('notifications').insert({
          user_id: data.user.id,
          title: 'Complete Your Profile',
          description: 'Tell us more about yourself...',
          category: 'profile',
          is_read: false,
        });
        if (data.session) router.push('/onboarding');
        else setShowVerificationDialog(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not create your account. Please try again.';
      setErrors({ form: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (loading || googleSignInInProgress) return;

    setLoading(true);
    try {
      await requestNotificationPermissions();
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error('Google login error:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const clearError = (field: keyof SignUpErrors) => setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  const genderOptions: Array<{ value: Exclude<Gender, ''>; label: string; icon: typeof GenderMale }> = [
    { value: 'male', label: 'Male', icon: GenderMale },
    { value: 'female', label: 'Female', icon: GenderFemale },
    { value: 'other', label: 'Prefer not to say', icon: GenderNeuter },
  ];

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.content}>
        <BackAction onPress={() => router.back()} />
        <View style={styles.header}>
          <SafeText variant="display">Create account</SafeText>
          <SafeText variant="body" color={colors.textSecondary}>Start your wellness journey today.</SafeText>
        </View>
        <FormSection>
          {errors.form && <InlineNotice>{errors.form}</InlineNotice>}
          <Input ref={nameRef} autoCapitalize="words" autoComplete="name" editable={!loading} error={errors.name} label="Full name" leading={<User color={colors.textSecondary} size={20} />} onChangeText={(value) => { setName(value); clearError('name'); }} placeholder="Your name" returnKeyType="next" value={name} onSubmitEditing={() => emailRef.current?.focus()} />
          <Input ref={emailRef} autoCapitalize="none" autoComplete="email" editable={!loading} error={errors.email} inputMode="email" keyboardType="email-address" label="Email" leading={<Envelope color={colors.textSecondary} size={20} />} onChangeText={(value) => { setEmail(value); clearError('email'); }} placeholder="you@example.com" returnKeyType="next" value={email} onSubmitEditing={() => passwordRef.current?.focus()} />
          <Input ref={passwordRef} autoComplete="new-password" editable={!loading} error={errors.password} label="Password" leading={<LockSimple color={colors.textSecondary} size={20} />} onChangeText={(value) => { setPassword(value); clearError('password'); }} placeholder="At least 6 characters" returnKeyType="done" secureTextEntry={!showPassword} textContentType="newPassword" value={password} onSubmitEditing={handleSignUp} trailing={<IconButton accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} disabled={loading} onPress={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeSlash color={colors.textSecondary} size={20} /> : <Eye color={colors.textSecondary} size={20} />}</IconButton>} />
          <View style={styles.genderField} accessibilityRole="radiogroup">
            <SafeText variant="label">Gender</SafeText>
            <SafeText variant="caption" color={colors.textSecondary}>Used to personalize your profile.</SafeText>
            <View style={styles.genderOptions}>
              {genderOptions.map(({ value, label, icon: GenderIcon }) => {
                const selected = gender === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityLabel={label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: loading }}
                    disabled={loading}
                    onPress={() => { setGender(value); clearError('gender'); }}
                    style={[styles.genderOption, { backgroundColor: colors.surface, borderColor: selected ? colors.focusRing : colors.border }]}
                  >
                    <GenderIcon color={selected ? colors.accent : colors.textSecondary} size={20} weight={selected ? 'fill' : 'regular'} />
                    <SafeText variant="caption" color={selected ? colors.text : colors.textSecondary}>{label}</SafeText>
                  </Pressable>
                );
              })}
            </View>
            {errors.gender && <InlineNotice>{errors.gender}</InlineNotice>}
          </View>
          <Button label={loading ? 'Creating account…' : 'Create account'} loading={loading} onPress={handleSignUp} />
          <View style={styles.alternative}>
            <DividerLabel />
            <Button label="Continue with Google" leading={<GoogleLogo color={colors.text} size={20} />} loading={loading || googleSignInInProgress} onPress={handleGoogleLogin} variant="secondary" />
          </View>
        </FormSection>
        <View style={styles.footer}>
          <SafeText variant="body" color={colors.textSecondary}>Already have an account?</SafeText>
          <Button label="Sign in" onPress={() => router.push('/loginscreen')} variant="link" />
        </View>
      </View>
      <CustomDialog
        visible={showVerificationDialog}
        title="Verify your email"
        message="We've sent a verification link to your email. Please check your inbox and activate your account."
        confirmText="Go to login"
        onConfirm={() => { setShowVerificationDialog(false); router.push('/loginscreen'); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingTop: 0 },
  content: { gap: spacing.field, paddingTop: spacing.field },
  header: { gap: spacing.micro },
  genderField: { gap: spacing.micro },
  genderOptions: { gap: spacing.micro },
  genderOption: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.micro,
    minHeight: 48,
    paddingHorizontal: spacing.control,
  },
  alternative: { gap: spacing.field },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.micro },
});
