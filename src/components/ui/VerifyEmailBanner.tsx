import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { resendVerification } from '../../services/firebase/auth';

/**
 * Non-blocking amber banner shown while the signed-in user's email is
 * unverified. Verification is encouraged, never required.
 */
export function VerifyEmailBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setStatus('sending');
    try {
      await resendVerification();
      setStatus('sent');
    } catch {
      setStatus('idle');
    }
  };

  return (
    <View className="mx-6 mt-4 flex-row items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <Text className="flex-1 pr-3 text-amber-800">{t('auth.verify_email_banner')}</Text>
      <TouchableOpacity
        onPress={handleResend}
        disabled={status !== 'idle'}
        className="rounded-lg bg-amber-500 px-3 py-2"
      >
        <Text className="font-semibold text-white">
          {status === 'sent' ? t('auth.verification_sent') : t('auth.resend')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
