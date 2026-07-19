import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { DateField } from '../../src/components/ui/DateField';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import { RiskFactorToggles } from '../../src/components/prescriptions/RiskFactorToggles';
import { SuggestionPanel } from '../../src/components/prescriptions/SuggestionPanel';
import {
  MedicineTableRow,
  type EditableItem,
} from '../../src/components/prescriptions/MedicineTableRow';
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

// Common "Sig" (timing) options for the instructions dropdown.
const TIMING_OPTIONS = ['After meal', 'Before meal', 'Empty stomach', 'With food', 'Bedtime', 'As needed'];
// Bangladeshi dose-convention quick chips.
const QUICK_DOSES = ['1+0+1', '1+1+1', '0+0+1', '1+0+0', '0+1+0', '1+1+0', 'SOS', 'As needed'];

let rowSeq = 0;
function emptyRow(): EditableItem {
  rowSeq += 1;
  return {
    _key: `row-${rowSeq}`,
    medicineName: '',
    genericName: '',
    strength: '',
    dosage: '',
    durationDays: 0,
    timing: '',
    instructions: '',
  };
}

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
  const [rows, setRows] = useState<EditableItem[]>(() => [emptyRow(), emptyRow()]);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
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

  // Per-row safety metadata for the Status column.
  const rowMeta = useMemo(
    () =>
      rows.map((row) => {
        const med = getMedicine(row.medicineName);
        return {
          known: !!med,
          warnings: med ? validateMedicine(med, diagnosis, complaint, riskFlags) : [],
        };
      }),
    [rows, diagnosis, complaint, riskFlags],
  );

  const patchRow = (key: string, patch: Partial<PrescriptionItem>) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)));

  const removeRow = (key: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev));

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const applyQuickDose = (dose: string) =>
    setRows((prev) => {
      if (!prev.length) return prev;
      let key = focusedKey && prev.some((r) => r._key === focusedKey) ? focusedKey : null;
      if (!key) {
        const empty = prev.find((r) => !r.dosage.trim());
        key = empty ? empty._key : prev[0]._key;
      }
      return prev.map((r) => (r._key === key ? { ...r, dosage: dose } : r));
    });

  // Add a suggested medicine — fill the first empty row, else append one.
  const addMedicine = (medicine: Medicine) => {
    if (rows.some((r) => r.medicineName === medicine.name)) return;
    const fill = (r: EditableItem): EditableItem => ({
      ...r,
      medicineName: medicine.name,
      genericName: medicine.generic,
      strength: medicine.strength,
      timing: r.timing || medicine.timing,
      instructions: r.instructions || medicine.caution,
    });
    const doAdd = () =>
      setRows((prev) => {
        const idx = prev.findIndex((r) => !r.medicineName.trim());
        if (idx >= 0) return prev.map((r, i) => (i === idx ? fill(r) : r));
        return [...prev, fill(emptyRow())];
      });
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
    const items: PrescriptionItem[] = rows
      .filter((r) => r.medicineName.trim())
      .map(({ _key, ...it }) => it);
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
                addedNames={rows.map((r) => r.medicineName)}
                onAddMedicine={addMedicine}
                onAddTests={addTests}
                onAddAdvice={addAdvice}
              />
            </Card>
          )}

          {/* Medicines table */}
          <Card className="p-4 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
                <Ionicons name="medkit" size={18} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-800">{t('prescriptions.medicines')}</Text>
                <Text className="text-xs text-slate-500">
                  {t('prescriptions.medicines_subtitle')}
                </Text>
              </View>
            </View>

            {/* Column headers */}
            <View className="flex-row gap-2 px-1 pt-1">
              <Text style={{ flex: 2.4 }} className="text-[11px] font-semibold text-slate-500 uppercase">
                {t('prescriptions.col_medicine')}
              </Text>
              <Text style={{ flex: 1.1 }} className="text-[11px] font-semibold text-slate-500 uppercase text-center">
                {t('prescriptions.dosage')}
              </Text>
              <Text style={{ flex: 1.1 }} className="text-[11px] font-semibold text-slate-500 uppercase text-center">
                {t('prescriptions.col_duration')}
              </Text>
              <Text style={{ flex: 1.6 }} className="text-[11px] font-semibold text-slate-500 uppercase">
                {t('prescriptions.instructions')}
              </Text>
              <Text style={{ flex: 1 }} className="text-[11px] font-semibold text-slate-500 uppercase">
                {t('prescriptions.col_status')}
              </Text>
              <View style={{ width: 26 }} />
            </View>

            {rows.map((row, i) => (
              <MedicineTableRow
                key={row._key}
                row={row}
                known={rowMeta[i]?.known ?? false}
                warnings={rowMeta[i]?.warnings ?? []}
                timingOptions={TIMING_OPTIONS}
                canRemove={rows.length > 1}
                onPatch={(patch) => patchRow(row._key, patch)}
                onRemove={() => removeRow(row._key)}
                onFocusRow={() => setFocusedKey(row._key)}
              />
            ))}

            <TouchableOpacity
              onPress={addRow}
              className="border border-dashed border-slate-300 rounded-xl py-3 items-center flex-row justify-center gap-1.5"
            >
              <Ionicons name="add" size={16} color="#0D9488" />
              <Text className="text-teal-600 text-sm font-semibold">{t('prescriptions.add_row')}</Text>
            </TouchableOpacity>

            {/* Quick dose chips */}
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-xs font-semibold text-slate-500">{t('prescriptions.quick_dose')}</Text>
              {QUICK_DOSES.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => applyQuickDose(d)}
                  className="bg-slate-100 rounded-lg px-2.5 py-1"
                >
                  <Text className="text-xs text-slate-600">{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <View className="gap-1">
              <Text className="text-sm font-medium text-slate-700">{t('prescriptions.follow_up')}</Text>
              <DateField value={followUpDate} onChange={setFollowUpDate} />
            </View>
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
