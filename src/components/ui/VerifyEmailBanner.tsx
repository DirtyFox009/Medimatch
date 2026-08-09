import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { resendVerification, refreshEmailVerified } from '../../services/firebase/auth';

/** How often to re-check while the banner is up (it unmounts once verified). */
const POLL_MS = 15000;

/**
 * Non-blocking amber banner shown while the signed-in user's email is
 * unverified. Verification is encouraged, never required.
 *
 * Clicking the emailed link does not fire onAuthStateChanged, and
 * `emailVerified` is cached on the user object — so the banner has to re-check
 * for itself, or it survives verification until a full page reload. It checks
 * on mount, whenever the app regains focus (the common case: the user clicks
 * the link, then comes back), and on a slow poll for a link opened elsewhere.
 */
export function VerifyEmailBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const emailVerified = useAuthStore((s) => s.emailVerified);
  const setEmailVerified = useAuthStore((s) => s.setEmailVerified);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const recheck = useCallback(async () => {
    try {
      const verified = await refreshEmailVerified();
      setEmailVerified(verified);
    } catch {
      // Offline or token expired — leave the banner up and try again later.
    }
  }, [setEmailVerified]);

  const hidden = !user || emailVerified;

  useEffect(() => {
    if (hidden) return;
    recheck();
    const timer = setInterval(recheck, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [hidden, recheck]);

  if (hidden) return null;

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
