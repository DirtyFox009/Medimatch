import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { DateField } from '../../src/components/ui/DateField';
import { GenderChips } from '../../src/components/ui/GenderChips';
import { signUp } from '../../src/services/firebase/auth';
import { showAlert } from '../../src/utils/alert';
import { ageFromDob } from '../../src/utils/formatDate';
import type { Gender } from '../../src/types/user';

interface RegisterForm {
  displayName: string;
  /** ISO YYYY-MM-DD — the account stores the birth date, and age is derived from it. */
  dateOfBirth: string;
  gender: Gender | '';
  email: string;
  password: string;
  confirmPassword: string;
  privacyAccepted: boolean;
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { privacyAccepted: false, dateOfBirth: '', gender: '' },
  });
  const password = watch('password');
  // Nobody was born tomorrow — caps the web date picker.
  const today = new Date().toISOString().slice(0, 10);

  const onSubmit = async (data: RegisterForm) => {
    if (!data.privacyAccepted) {
      showAlert('Privacy Policy', t('auth.privacy_required'));
      return;
    }
    setLoading(true);
    try {
      await signUp(data.email, data.password, {
        displayName: data.displayName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as Gender,
      });
    } catch (e: any) {
      const code = e.code ? `[${e.code}]` : '';
      showAlert('Registration failed', `${code} ${e.message ?? 'Could not create account'}`.trim());
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

        <View className="px-6 pt-8 gap-5 pb-8 w-full md:max-w-md md:self-center">
          <Text className="text-2xl font-bold text-slate-800">{t('auth.register_title')}</Text>

          <Controller
            control={control}
            name="displayName"
            rules={{ required: 'Full name is required' }}
            render={({ field: { onChange, value, ref } }) => (
              <Input ref={ref} label={t('auth.full_name')} placeholder="Rahim Uddin" value={value} onChangeText={onChange} error={errors.displayName?.message} />
            )}
          />

          {/* Date of birth, not age: the doctor's prescription derives the current
              age from it, so it stays correct for the life of the account. */}
          <Controller
            control={control}
            name="dateOfBirth"
            rules={{
              required: t('auth.dob_required'),
              validate: (v) => ageFromDob(v) !== null || t('auth.dob_invalid'),
            }}
            render={({ field: { onChange, value } }) => (
              <DateField
                label={t('auth.date_of_birth')}
                value={value}
                onChange={onChange}
                max={today}
                error={errors.dateOfBirth?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            rules={{ required: t('auth.gender_required') }}
            render={({ field: { onChange, value } }) => (
              <GenderChips
                label={t('auth.gender')}
                value={value}
                onChange={onChange}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            rules={{ required: 'Email required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }}
            render={({ field: { onChange, value, ref } }) => (
              <Input ref={ref} label={t('auth.email')} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} error={errors.email?.message} />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } }}
            render={({ field: { onChange, value, ref } }) => (
              <Input ref={ref} label={t('auth.password')} placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} error={errors.password?.message} />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            rules={{ required: 'Please confirm password', validate: (v) => v === password || 'Passwords do not match' }}
            render={({ field: { onChange, value, ref } }) => (
              <Input ref={ref} label={t('auth.confirm_password')} placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} error={errors.confirmPassword?.message} />
            )}
          />

          {/* Privacy consent */}
          <Controller
            control={control}
            name="privacyAccepted"
            render={({ field: { onChange, value } }) => (
              <View>
                <TouchableOpacity
                  className="flex-row items-start gap-3"
                  onPress={() => onChange(!value)}
                  activeOpacity={0.7}
                >
                  <View className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center ${value ? 'bg-primary-500 border-primary-500' : 'border-slate-300'}`}>
                    {value && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text className="flex-1 text-sm text-slate-600">
                    {t('auth.privacy_consent')}{' '}
                    <Link href="/privacy">
                      <Text className="text-primary-600 underline">Privacy Policy</Text>
                    </Link>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <Button title={t('auth.register')} onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />

          <View className="flex-row justify-center gap-1">
            <Text className="text-slate-500">{t('auth.have_account')}</Text>
            <Link href="/(auth)/login">
              <Text className="text-primary-600 font-semibold">{t('auth.login')}</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
