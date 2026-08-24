import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { Envelope } from 'phosphor-react-native';

import { SafeText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { FormSection, InlineNotice } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { BackAction } from '@/components/ui/Navigation';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';

const resetSchema = z.object({ email: z.string().trim().email('Enter a valid email address.') });

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (loading) return;

    const result = resetSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.flatten().fieldErrors.email?.[0] ?? 'Enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setError('');
    setFormError('');
    setLoading(true);
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: 'uniwell://reset-password-callback',
      });
      if (requestError) throw requestError;
      toast.success('Password reset instructions sent to your email');
      router.back();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'We could not send a reset link. Please try again.';
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.content}>
        <BackAction onPress={() => router.back()} />
        <View style={styles.header}>
          <SafeText variant="display">Reset password</SafeText>
          <SafeText variant="body" color={colors.textSecondary}>Enter your email and we&apos;ll send instructions to reset your password.</SafeText>
        </View>
        <FormSection>
          {formError && <InlineNotice>{formError}</InlineNotice>}
          <Input
            ref={emailRef}
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
            error={error}
            inputMode="email"
            keyboardType="email-address"
            label="Email"
            leading={<Envelope color={colors.textSecondary} size={20} />}
            onChangeText={(value) => { setEmail(value); setError(''); setFormError(''); }}
            onSubmitEditing={handleResetPassword}
            placeholder="you@example.com"
            returnKeyType="go"
            value={email}
          />
          <Button label={loading ? 'Sending reset link…' : 'Send reset link'} loading={loading} onPress={handleResetPassword} />
        </FormSection>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingTop: 0 },
  content: { gap: spacing.field, paddingTop: spacing.field },
  header: { gap: spacing.micro },
});
