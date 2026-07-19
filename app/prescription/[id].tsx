import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { getPrescription } from '../../src/services/firebase/firestore';
import { printPrescription } from '../../src/services/prescriptions/print';
import { showAlert } from '../../src/utils/alert';
import { formatAppointmentDate } from '../../src/utils/formatDate';
import type { Prescription } from '../../src/types/prescription';

export default function PrescriptionDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const data = await getPrescription(id);
        if (active) setPrescription(data);
      } catch (e) {
        console.error('[PrescriptionDetail] load error:', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePrint = async () => {
    if (!prescription) return;
    setPrinting(true);
    try {
      await printPrescription(prescription);
    } catch (e) {
      console.error('[PrescriptionDetail] print error:', e);
      showAlert(t('common.error'));
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4 gap-4" edges={['bottom']}>
        <Skeleton height={100} />
        <Skeleton height={60} />
        <Skeleton height={80} />
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-8">
        <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
        <Text className="text-slate-400 mt-3 text-center">{t('prescriptions.not_found')}</Text>
      </SafeAreaView>
    );
  }

  const isBn = i18n.language === 'bn';
  const doctorName =
    isBn && prescription.doctorNameBn ? prescription.doctorNameBn : prescription.doctorNameEn;
  const hospitalName =
    isBn && prescription.hospitalNameBn ? prescription.hospitalNameBn : prescription.hospitalNameEn;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero — issuing doctor */}
          <View className="bg-white px-6 py-6 gap-4">
            <View className="flex-row gap-4 items-start">
              <Avatar uri={null} name={prescription.doctorNameEn} size={64} />
              <View className="flex-1 gap-1">
                <Text className="text-xl font-bold text-slate-800">{doctorName}</Text>
                <Text className="text-primary-600 font-medium">{prescription.specialty}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={12} color="#64748B" />
                  <Text className="text-slate-500 text-sm">{hospitalName}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />
                  <Text className="text-slate-500 text-sm">
                    {formatAppointmentDate(prescription.date)}
                  </Text>
                </View>
              </View>
            </View>

            {prescription.bmdcReg && (
              <View className="bg-sky-50 rounded-xl px-3 py-2 flex-row items-center gap-2">
                <Ionicons name="ribbon" size={14} color="#0EA5E9" />
                <Text className="text-sky-700 text-xs">
                  {t('doctors.bmdc_reg')}: <Text className="font-bold">{prescription.bmdcReg}</Text>
                </Text>
              </View>
            )}

            {prescription.qualifications.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {prescription.qualifications.map((q, i) => (
                  <Badge key={i} label={q} color="blue" />
                ))}
              </View>
            )}
          </View>

          {/* Patient */}
          <View className="mx-4 mt-4">
            <Card className="overflow-hidden">
              <View className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                <Text className="font-semibold text-slate-700">
                  {t('prescriptions.patient_info')}
                </Text>
              </View>
              <View className="p-4 gap-2">
                <Text className="font-bold text-slate-800 text-base">
                  {prescription.patientName}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {!!prescription.patientAge && (
                    <Badge
                      label={`${t('prescriptions.age')}: ${prescription.patientAge}`}
                      color="blue"
                    />
                  )}
                  {!!prescription.patientGender && (
                    <Badge
                      label={t(`prescriptions.gender_${prescription.patientGender}`)}
                      color="sky"
                    />
                  )}
                  {!!prescription.patientWeight && (
                    <Badge label={`${prescription.patientWeight} kg`} color="teal" />
                  )}
                </View>
              </View>
            </Card>
          </View>

          {/* Complaint & diagnosis */}
          {(!!prescription.complaint || !!prescription.diagnosis) && (
            <View className="mx-4 mt-4">
              <Card className="p-4 gap-3">
                {!!prescription.complaint && (
                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-slate-500 uppercase">
                      {t('prescriptions.complaint')}
                    </Text>
                    <Text className="text-slate-700 text-sm">{prescription.complaint}</Text>
                  </View>
                )}
                {!!prescription.diagnosis && (
                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-slate-500 uppercase">
                      {t('prescriptions.diagnosis')}
                    </Text>
                    <Text className="text-slate-700 text-sm">{prescription.diagnosis}</Text>
                  </View>
                )}
              </Card>
            </View>
          )}

          {/* Medicines */}
          <View className="mx-4 mt-4">
            <Card className="overflow-hidden">
              <View className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                <Text className="font-semibold text-slate-700">{t('prescriptions.medicines')}</Text>
              </View>
              <View className="p-4 gap-3">
                {prescription.items.map((item, i) => (
                  <View
                    key={`${item.medicineName}-${i}`}
                    className={`flex-row items-start gap-3 ${
                      i < prescription.items.length - 1 ? 'pb-3 border-b border-slate-100' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                      <Ionicons name="medkit-outline" size={20} color="#64748B" />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="font-semibold text-slate-800">{item.medicineName}</Text>
                      {!!item.genericName && (
                        <Text className="text-xs text-slate-500">{item.genericName}</Text>
                      )}
                      <View className="flex-row flex-wrap gap-2">
                        {!!item.dosage && <Badge label={item.dosage} color="blue" />}
                        {item.durationDays > 0 && (
                          <Badge
                            label={t('prescriptions.days_count', { count: item.durationDays })}
                            color="sky"
                          />
                        )}
                        {!!item.timing && <Badge label={item.timing} color="teal" />}
                      </View>
                      {!!item.instructions && (
                        <Text className="text-xs text-slate-500">{item.instructions}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          {/* Investigations */}
          {prescription.tests.length > 0 && (
            <View className="mx-4 mt-4">
              <Card className="p-4 gap-2">
                <Text className="text-xs font-semibold text-slate-500 uppercase">
                  {t('prescriptions.tests')}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {prescription.tests.map((test) => (
                    <View key={test} className="bg-primary-50 px-3 py-1 rounded-full">
                      <Text className="text-primary-700 text-sm font-medium">{test}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {/* Advice & follow-up */}
          {(!!prescription.advice || !!prescription.followUpDate) && (
            <View className="mx-4 mt-4">
              <Card className="p-4 gap-3">
                {!!prescription.advice && (
                  <View className="gap-1">
                    <Text className="text-xs font-semibold text-slate-500 uppercase">
                      {t('prescriptions.advice')}
                    </Text>
                    <Text className="text-slate-700 text-sm">{prescription.advice}</Text>
                  </View>
                )}
                {!!prescription.followUpDate && (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text className="text-slate-600 text-sm">
                      {t('prescriptions.follow_up')}:{' '}
                      <Text className="font-semibold text-slate-800">
                        {formatAppointmentDate(prescription.followUpDate)}
                      </Text>
                    </Text>
                  </View>
                )}
              </Card>
            </View>
          )}

          <Text className="text-xs text-slate-400 text-center mt-4 mb-4 px-6">
            {t('prescriptions.digitally_generated')}
          </Text>
        </ScrollView>

        {/* Sticky CTA */}
        <View className="bg-white px-4 py-4 border-t border-slate-100">
          <Button
            title={t('prescriptions.download_pdf')}
            loading={printing}
            fullWidth
            onPress={handlePrint}
          />
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
