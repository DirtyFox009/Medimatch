import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { signIn } from '../../src/services/firebase/auth';
import { showAlert } from '../../src/utils/alert';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      // AuthGate in _layout handles redirect
    } catch (e: any) {
      showAlert('Login failed', e.message ?? 'Invalid email or password');
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
        {/* Header */}
        <View className="bg-primary-500 px-6 pt-16 pb-10">
          <Text className="text-4xl font-bold text-white">MediMatch</Text>
          <Text className="text-primary-100 mt-1">{t('tagline')}</Text>
        </View>

        <View className="px-6 pt-8 gap-5 w-full md:max-w-md md:self-center">
          <View>
            <Text className="text-2xl font-bold text-slate-800">{t('auth.login_title')}</Text>
          </View>

          <Controller
            control={control}
            name="email"
            rules={{ required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }}
            render={({ field: { onChange, value, ref } }) => (
              <Input
                ref={ref}
                label={t('auth.email')}
                placeholder="doctor@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
            render={({ field: { onChange, value, ref } }) => (
              <Input
                ref={ref}
                label={t('auth.password')}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <View className="flex-row justify-end">
            <Link href="/(auth)/forgot-password">
              <Text className="text-primary-600 font-medium">{t('auth.forgot_password')}</Text>
            </Link>
          </View>

          <Button
            title={t('auth.login')}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
          />

          <View className="flex-row justify-center gap-1">
            <Text className="text-slate-500">{t('auth.no_account')}</Text>
            <Link href="/(auth)/register">
              <Text className="text-primary-600 font-semibold">{t('auth.register')}</Text>
            </Link>
          </View>

          {/* Emergency locator works without an account (FR10) */}
          <TouchableOpacity
            onPress={() => router.push('/emergency')}
            className="flex-row items-center justify-center gap-2 border border-red-200 bg-red-50 rounded-xl px-4 py-3 mb-8"
          >
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="text-red-600 font-semibold">{t('auth.emergency_link')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
