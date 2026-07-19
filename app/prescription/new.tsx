import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { RiskFactorToggles } from '../../src/components/prescriptions/RiskFactorToggles';
import { MedicineSearchInput } from '../../src/components/prescriptions/MedicineSearchInput';
import { SuggestionPanel } from '../../src/components/prescriptions/SuggestionPanel';
import { PrescriptionItemRow } from '../../src/components/prescriptions/PrescriptionItemRow';
import { useAuth } from '../../src/hooks/useAuth';
import { showAlert } from '../../src/utils/alert';
import {
  createPrescription,
  getAppointment,
  getDoctor,
} from '../../src/services/firebase/firestore';
import {
  EMPTY_RISK_FLAGS,
  getSuggestions,
  validateMedicine,
} from '../../src/services/prescriptions/engine';
import { getMedicine } from '../../src/services/prescriptions/medicines';
import type { Medicine, SuggestionResult } from '../../src/services/prescriptions/engineTypes';
import type { Appointment } from '../../src/types/appointment';
import type { Doctor } from '../../src/types/doctor';
import type {
  PatientGender,
  PatientRiskFlags,
  PrescriptionItem,
} from '../../src/types/prescription';

const EMPTY_SUGGESTIONS: SuggestionResult = {
  diseases: [],
  suggestions: [],
  tests: [],
  advice: [],
  emergencyFlags: [],
  warnings: [],
};

const GENDERS: PatientGender[] = ['male', 'female', 'other'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewPrescriptionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { user, appUser, isLoading } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<PatientGender>('');
  const [patientWeight, setPatientWeight] = useState('');
  const [riskFlags, setRiskFlags] = useState<PatientRiskFlags>(EMPTY_RISK_FLAGS);
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [tests, setTests] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionResult>(EMPTY_SUGGESTIONS);

  useEffect(() => {
    if (!appointmentId || !user || !appUser?.doctorId) return;
    let active = true;
    (async () => {
      try {
        const [appt, doc] = await Promise.all([
          getAppointment(appointmentId),
          getDoctor(appUser.doctorId!),
        ]);
        if (!active) return;
        if (!appt || !doc || appt.doctorUserId !== user.uid) {
          setLoadError(true);
        } else {
          setAppointment(appt);
          setDoctor(doc);
          if (appt.chatSummary) setComplaint(appt.chatSummary);
        }
      } catch (e) {
        console.error('[NewPrescription] load error:', e);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [appointmentId, user, appUser?.doctorId]);

  // Elderly/pediatric flags follow the typed age.
  useEffect(() => {
    const age = parseInt(patientAge, 10);
    if (Number.isNaN(age)) return;
    setRiskFlags((f) => ({ ...f, elderly: age >= 65, pediatric: age > 0 && age < 12 }));
  }, [patientAge]);

  // Debounced clinical suggestions (pure sync engine; debounce avoids churn).
  useEffect(() => {
    const handle = setTimeout(() => {
      setSuggestions(getSuggestions(diagnosis, complaint, riskFlags));
    }, 300);
    return () => clearTimeout(handle);
  }, [diagnosis, complaint, riskFlags]);

  const itemWarnings = useMemo(
    () =>
      items.map((item) => {
        const med = getMedicine(item.medicineName);
        return med ? validateMedicine(med, diagnosis, complaint, riskFlags) : [];
      }),
    [items, diagnosis, complaint, riskFlags],
  );

  const addMedicine = (medicine: Medicine) => {
    if (items.some((i) => i.medicineName === medicine.name)) return;
    const doAdd = () =>
      setItems((prev) => [
        ...prev,
        {
          medicineName: medicine.name,
          genericName: medicine.generic,
          strength: medicine.strength,
          dosage: '',
          durationDays: 0,
          timing: medicine.timing,
          instructions: medicine.caution,
        },
      ]);
    const warnings = validateMedicine(medicine, diagnosis, complaint, riskFlags);
    if (warnings.some((w) => w.level === 'danger')) {
      showAlert(
        t('prescriptions.contraindicated'),
        `${warnings.map((w) => w.message).join('\n')}\n\n${t('prescriptions.confirm_unsafe')}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.add'), style: 'destructive', onPress: doAdd },
        ],
      );
    } else {
      doAdd();
    }
  };

  const addTests = (suggested: string[]) => {
    const existing = tests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = [...existing, ...suggested.filter((s) => !existing.includes(s))];
    setTests(merged.join(', '));
  };

  const addAdvice = (line: string) => {
    if (advice.includes(line)) return;
    setAdvice((prev) => (prev ? `${prev}\n${line}` : line));
  };

  const handleSave = async () => {
    if (!appointment || !doctor || !user) return;
    if (!patientName.trim() || !diagnosis.trim() || items.length === 0) {
      showAlert(t('prescriptions.validation_required'));
      return;
    }
    setSaving(true);
    try {
      const id = await createPrescription({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: doctor.id,
        doctorUserId: user.uid,
        patientName: patientName.trim(),
        patientAge: patientAge.trim(),
        patientGender,
        patientWeight: patientWeight.trim(),
        complaint: complaint.trim(),
        diagnosis: diagnosis.trim(),
        riskFlags,
        items,
        tests: tests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        advice: advice.trim(),
        followUpDate: followUpDate.trim() || null,
        doctorNameEn: doctor.nameEn,
        doctorNameBn: doctor.nameBn,
        qualifications: doctor.qualifications ?? [],
        bmdcReg: doctor.bmdcReg,
        specialty: doctor.specialty,
        hospitalNameEn: doctor.hospitalNameEn,
        hospitalNameBn: doctor.hospitalNameBn,
        date: todayStr(),
      });
      router.replace(`/prescription/${id}`);
    } catch (e) {
      console.error('[NewPrescription] save error:', e);
      showAlert(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isLoading && appUser && appUser.role !== 'doctor') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (loading || isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0D9488" />
      </SafeAreaView>
    );
  }

  if (loadError || !appointment || !doctor) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
        <Text className="text-slate-400 mt-3 text-center">{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          {/* Patient information */}
          <Card className="p-4 gap-3">
            <Text className="font-bold text-slate-800">{t('prescriptions.patient_info')}</Text>
            {appointment.severity && (
              <Text className="text-xs text-slate-500">
                {t('doctor_portal.severity')}: {appointment.severity}
              </Text>
            )}
            <Input
              label={t('prescriptions.patient_name')}
              value={patientName}
              onChangeText={setPatientName}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  label={t('prescriptions.age')}
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Input
                  label={t('prescriptions.weight')}
                  value={patientWeight}
                  onChangeText={setPatientWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-sm font-medium text-slate-700">{t('prescriptions.gender')}</Text>
              <View className="flex-row gap-2">
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setPatientGender(g)}
                    className={`px-3 py-1.5 rounded-full border ${
                      patientGender === g ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${patientGender === g ? 'text-white' : 'text-slate-600'}`}
                    >
                      {t(`prescriptions.gender_${g}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Risk factors */}
          <Card className="p-4 gap-3">
            <Text className="font-bold text-slate-800">{t('prescriptions.risk_factors')}</Text>
            <RiskFactorToggles flags={riskFlags} onChange={setRiskFlags} />
          </Card>

          {/* Complaint & diagnosis */}
          <Card className="p-4 gap-3">
            <Input
              label={t('prescriptions.complaint')}
              value={complaint}
              onChangeText={setComplaint}
              multiline
            />
            <Input
              label={t('prescriptions.diagnosis')}
              value={diagnosis}
              onChangeText={setDiagnosis}
              multiline
            />
          </Card>

          {/* Clinical suggestions */}
          {suggestions.diseases.length > 0 && (
            <Card className="p-4 gap-3">
              <Text className="font-bold text-slate-800">{t('prescriptions.suggestions')}</Text>
              <SuggestionPanel
                result={suggestions}
                addedNames={items.map((i) => i.medicineName)}
                onAddMedicine={addMedicine}
                onAddTests={addTests}
                onAddAdvice={addAdvice}
              />
            </Card>
          )}

          {/* Medicines */}
          <Card className="p-4 gap-3">
            <Text className="font-bold text-slate-800">{t('prescriptions.medicines')}</Text>
            <MedicineSearchInput onSelect={addMedicine} />
            {items.map((item, index) => (
              <PrescriptionItemRow
                key={item.medicineName}
                index={index}
                item={item}
                warnings={itemWarnings[index] ?? []}
                isLast={index === items.length - 1}
                onChange={(next) =>
                  setItems((prev) => prev.map((it, i) => (i === index ? next : it)))
                }
                onRemove={() => setItems((prev) => prev.filter((_, i) => i !== index))}
              />
            ))}
            {items.length === 0 && (
              <Text className="text-xs text-slate-400">{t('prescriptions.no_medicines_yet')}</Text>
            )}
          </Card>

          {/* Tests, advice, follow-up */}
          <Card className="p-4 gap-3">
            <Input
              label={t('prescriptions.tests')}
              value={tests}
              onChangeText={setTests}
              placeholder="CBC, CRP"
            />
            <Input
              label={t('prescriptions.advice')}
              value={advice}
              onChangeText={setAdvice}
              multiline
              className="min-h-[80px]"
            />
            <Input
              label={t('prescriptions.follow_up')}
              value={followUpDate}
              onChangeText={setFollowUpDate}
              placeholder="YYYY-MM-DD"
            />
          </Card>

          <Button
            title={t('prescriptions.save')}
            loading={saving}
            fullWidth
            onPress={handleSave}
          />
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
