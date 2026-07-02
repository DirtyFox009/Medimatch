import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { resetPassword } from '../../src/services/firebase/auth';
import { showAlert } from '../../src/utils/alert';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await resetPassword(data.email.trim());
      setSent(true);
    } catch (e: any) {
      // Don't reveal whether the email exists; generic failure only for
      // malformed emails / network issues.
      if (e?.code === 'auth/invalid-email') {
        showAlert(t('auth.reset_password'), t('auth.reset_invalid_email'));
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="bg-primary-500 px-6 pt-16 pb-10">
          <Text className="text-4xl font-bold text-white">MediMatch</Text>
          <Text className="text-primary-100 mt-1">{t('tagline')}</Text>
        </View>

        <View className="px-6 pt-8 gap-5 w-full md:max-w-md md:self-center">
          <View>
            <Text className="text-2xl font-bold text-slate-800">{t('auth.reset_password')}</Text>
            <Text className="text-slate-500 mt-1">{t('auth.reset_instructions')}</Text>
          </View>

          {sent ? (
            <View className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <Text className="text-teal-800 font-semibold">{t('auth.reset_sent_title')}</Text>
              <Text className="text-teal-700 mt-1">{t('auth.reset_sent')}</Text>
            </View>
          ) : (
            <>
              <Controller
                control={control}
                name="email"
                rules={{ required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }}
                render={({ field: { onChange, value, ref } }) => (
                  <Input
                    ref={ref}
                    label={t('auth.email')}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                  />
                )}
              />

              <Button
                title={t('auth.send_reset_link')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                fullWidth
                size="lg"
              />
            </>
          )}

          <View className="flex-row justify-center gap-1">
            <Link href="/(auth)/login">
              <Text className="text-primary-600 font-semibold">{t('auth.back_to_login')}</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
