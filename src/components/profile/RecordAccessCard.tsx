import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import {
  subscribeRecordGrants,
  revokeRecordAccess,
  getDoctor,
} from '../../services/firebase/firestore';
import { showAlert } from '../../utils/alert';
import { isGrantActive } from '../../utils/recordAccess';
import { formatAppointmentDate } from '../../utils/formatDate';
import type { RecordGrant } from '../../types/user';

/**
 * "Doctors with access to my records" — the patient-visible half of the record
 * access grants. Access also lapses on its own (the rules enforce the expiry);
 * this is the manual override.
 */
export function RecordAccessCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const [grants, setGrants] = useState<RecordGrant[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeRecordGrants(
      patientId,
      (g) => {
        setGrants(g);
        setLoading(false);
      },
      (e) => {
        console.error('[RecordAccessCard] subscription failed:', e);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [patientId]);

  // Grants store the doctors/{id} reference, not the name.
  useEffect(() => {
    let active = true;
    const missing = grants.map((g) => g.doctorId).filter((id) => id && !(id in names));
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => getDoctor(id).catch(() => null))).then((docs) => {
      if (!active) return;
      const next: Record<string, string> = {};
      docs.forEach((d, i) => { next[missing[i]] = d?.nameEn ?? ''; });
      setNames((prev) => ({ ...prev, ...next }));
    });
    return () => { active = false; };
  }, [grants, names]);

  const confirmRevoke = (grant: RecordGrant) => {
    const who = names[grant.doctorId] || t('profile.this_doctor');
    showAlert(t('profile.revoke_access'), t('profile.revoke_confirm', { name: who }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.revoke'),
        style: 'destructive',
        onPress: async () => {
          setBusyId(grant.doctorUserId);
          try {
            await revokeRecordAccess(patientId, grant.doctorUserId);
          } catch {
            showAlert(t('common.error'));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  // An expired grant is already powerless — showing it would imply otherwise.
  const active = grants.filter((g) => isGrantActive(g.expiresAt));

  return (
    <Card className="p-5 gap-4">
      <View className="flex-row items-center gap-2">
        <Ionicons name="shield-checkmark-outline" size={18} color="#0D9488" />
        <Text className="font-semibold text-slate-800 flex-1">{t('profile.record_access')}</Text>
      </View>
      <Text className="text-xs text-slate-500 -mt-2">{t('profile.record_access_hint')}</Text>

      {loading ? (
        <ActivityIndicator color="#0D9488" />
      ) : active.length === 0 ? (
        <Text className="text-slate-400 text-sm">{t('profile.no_doctor_access')}</Text>
      ) : (
        active.map((grant) => (
          <View
            key={grant.doctorUserId}
            className="flex-row items-center justify-between border-t border-slate-100 pt-3"
          >
            <View className="flex-1 pr-3">
              <Text className="text-slate-800 font-medium">
                {names[grant.doctorId] || t('profile.this_doctor')}
              </Text>
              <Text className="text-slate-500 text-xs mt-0.5">
                {grant.expiresAt
                  ? t('profile.access_until', {
                      date: formatAppointmentDate(grant.expiresAt.toISOString().slice(0, 10)),
                    })
                  : ''}
              </Text>
            </View>
            <TouchableOpacity
              disabled={busyId === grant.doctorUserId}
              onPress={() => confirmRevoke(grant)}
              className="border border-red-200 rounded-lg px-3 py-2"
            >
              <Text className="text-red-600 text-xs font-semibold">{t('profile.revoke')}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </Card>
  );
}
