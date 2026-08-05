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
}

/**
 * Matched diseases, emergency flags, and suggested medicines only.
 * Suggested tests / advice now live next to their own form fields
 * (see SuggestedTests / SuggestedAdvice below) so the doctor sees the
 * suggestion right where they'll use it.
 */
export function SuggestionPanel({ result, addedNames, onAddMedicine }: SuggestionPanelProps) {
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
    </View>
  );
}

interface SuggestedTestsProps {
  tests: string[];
  /** Tests already present in the Investigations field, so we can show them as added. */
  addedTests: string[];
  /** Add a single test. */
  onAddTest: (test: string) => void;
  /** Add every suggested test at once. */
  onAddAll: () => void;
}

/**
 * Chip list of suggested investigations, placed directly above the
 * Investigations field. Each chip adds just that one test on tap;
 * "Add all" remains for doctors who want everything at once.
 * Already-added tests show a checkmark and can't be re-added.
 */
export function SuggestedTests({ tests, addedTests, onAddTest, onAddAll }: SuggestedTestsProps) {
  const { t } = useTranslation();
  if (tests.length === 0) return null;

  const allAdded = tests.every((test) => addedTests.includes(test));

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-slate-500 uppercase">
          {t('prescriptions.suggested_tests')}
        </Text>
        {!allAdded && (
          <TouchableOpacity onPress={onAddAll}>
            <Text className="text-teal-600 text-xs font-semibold">
              {t('prescriptions.add_all')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {tests.map((test) => {
          const added = addedTests.includes(test);
          return (
            <TouchableOpacity
              key={test}
              disabled={added}
              onPress={() => onAddTest(test)}
              className={`flex-row items-center gap-1 px-3 py-1 rounded-full ${
                added ? 'bg-teal-50' : 'bg-primary-50'
              }`}
            >
              {added && <Ionicons name="checkmark-circle" size={14} color="#0D9488" />}
              <Text
                className={`text-sm font-medium ${added ? 'text-teal-600' : 'text-primary-700'}`}
              >
                {test}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SuggestedAdviceProps {
  advice: string[];
  /** Advice lines already present in the Advice field. */
  addedAdvice: string[];
  onAddAdvice: (line: string) => void;
}

/**
 * List of suggested advice lines, placed directly above the Advice field.
 * Each line adds itself on tap; already-added lines show a checkmark
 * and can't be re-added (no duplicate lines cluttering the note).
 */
export function SuggestedAdvice({ advice, addedAdvice, onAddAdvice }: SuggestedAdviceProps) {
  const { t } = useTranslation();
  if (advice.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-slate-500 uppercase">
        {t('prescriptions.suggested_advice')}
      </Text>
      {advice.map((line) => {
        const added = addedAdvice.includes(line);
        return (
          <TouchableOpacity
            key={line}
            disabled={added}
            onPress={() => onAddAdvice(line)}
            className="flex-row items-center gap-1.5"
          >
            <Ionicons
              name={added ? 'checkmark-circle' : 'add-circle-outline'}
              size={14}
              color="#0D9488"
            />
            <Text className={`text-xs flex-1 ${added ? 'text-teal-600' : 'text-slate-600'}`}>
              {line}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
