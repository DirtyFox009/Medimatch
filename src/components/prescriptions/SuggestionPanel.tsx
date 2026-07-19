import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/Badge';
import type { Medicine, SuggestionResult } from '../../services/prescriptions/engineTypes';

interface SuggestionPanelProps {
  result: SuggestionResult;
  /** Names of medicines already on the prescription (hidden from suggestions). */
  addedNames: string[];
  onAddMedicine: (medicine: Medicine) => void;
  onAddTests: (tests: string[]) => void;
  onAddAdvice: (advice: string) => void;
}

export function SuggestionPanel({
  result,
  addedNames,
  onAddMedicine,
  onAddTests,
  onAddAdvice,
}: SuggestionPanelProps) {
  const { t } = useTranslation();
  if (result.diseases.length === 0) return null;

  const visibleSuggestions = result.suggestions.filter(
    (s) => !addedNames.includes(s.medicine.name),
  );

  return (
    <View className="gap-3">
      {/* Matched diseases */}
      <View className="flex-row flex-wrap gap-2 items-center">
        {result.diseases.map((d) => (
          <Badge key={d.key} label={`${d.displayName} · ${d.icd10}`} color="teal" />
        ))}
      </View>
      {result.diseases.map(
        (d) =>
          d.note && (
            <View key={`note-${d.key}`} className="bg-slate-50 rounded-xl px-3 py-2">
              <Text className="text-xs text-slate-500">{d.note}</Text>
            </View>
          ),
      )}

      {/* Emergency red flags */}
      {result.emergencyFlags.length > 0 && (
        <View className="bg-red-50 rounded-xl px-3 py-2 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="warning" size={14} color="#DC2626" />
            <Text className="text-xs font-bold text-red-600">
              {t('prescriptions.emergency_warning')}
            </Text>
          </View>
          {result.emergencyFlags.map((flag) => (
            <Text key={flag} className="text-xs text-red-600">
              • {flag}
            </Text>
          ))}
        </View>
      )}

      {/* Suggested medicines */}
      {visibleSuggestions.length > 0 && (
        <View className="gap-3">
          <Text className="text-xs font-semibold text-slate-500 uppercase">
            {t('prescriptions.suggested_medicines')}
          </Text>
          {visibleSuggestions.map(({ medicine, warnings, blocked }, i) => (
            <View
              key={medicine.name}
              className={`flex-row items-center gap-3 ${
                i < visibleSuggestions.length - 1 ? 'pb-3 border-b border-slate-100' : ''
              }`}
            >
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                <Ionicons name="medkit-outline" size={20} color="#64748B" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-semibold text-slate-800 text-sm">{medicine.name}</Text>
                <Text className="text-xs text-slate-500">
                  {medicine.generic} · {medicine.timing}
                </Text>
                {warnings.length > 0 && (
                  <View className="flex-row flex-wrap gap-1.5 mt-0.5">
                    {warnings.map((w) => (
                      <Badge
                        key={w.message}
                        label={w.message}
                        color={w.level === 'danger' ? 'red' : 'amber'}
                      />
                    ))}
                  </View>
                )}
              </View>
              {blocked ? (
                <Badge label={t('prescriptions.contraindicated')} color="red" />
              ) : (
                <TouchableOpacity
                  onPress={() => onAddMedicine(medicine)}
                  className="bg-teal-500 rounded-lg px-3 py-2"
                >
                  <Text className="text-white text-xs font-semibold">{t('common.add')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Suggested tests */}
      {result.tests.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-500 uppercase">
              {t('prescriptions.suggested_tests')}
            </Text>
            <TouchableOpacity onPress={() => onAddTests(result.tests)}>
              <Text className="text-teal-600 text-xs font-semibold">
                {t('prescriptions.add_all')}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {result.tests.map((test) => (
              <View key={test} className="bg-primary-50 px-3 py-1 rounded-full">
                <Text className="text-primary-700 text-sm font-medium">{test}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Suggested advice */}
      {result.advice.length > 0 && (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-slate-500 uppercase">
            {t('prescriptions.suggested_advice')}
          </Text>
          {result.advice.map((line) => (
            <TouchableOpacity
              key={line}
              onPress={() => onAddAdvice(line)}
              className="flex-row items-center gap-1.5"
            >
              <Ionicons name="add-circle-outline" size={14} color="#0D9488" />
              <Text className="text-xs text-slate-600 flex-1">{line}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
