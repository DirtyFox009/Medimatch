import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SeverityBadge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { TriageResult } from '../../types/chat';
import type { Specialty } from '../../types/doctor';

interface SeverityCardProps {
  result: TriageResult;
  suggestedSpecialty: Specialty | null;
}

const DISCLAIMER_EN =
  '⚠️ This is not a medical diagnosis. Please consult a licensed doctor for proper evaluation and treatment.';
const DISCLAIMER_BN =
  '⚠️ এটি চিকিৎসা নির্ণয় নয়। সঠিক মূল্যায়ন ও চিকিৎসার জন্য একজন লাইসেন্সপ্রাপ্ত ডাক্তারের পরামর্শ নিন।';

export function SeverityCard({ result, suggestedSpecialty }: SeverityCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const disclaimer = result.language === 'bn' ? DISCLAIMER_BN : DISCLAIMER_EN;

  const handleFindDoctors = () => {
    if (suggestedSpecialty) {
      router.push({ pathname: '/(tabs)/doctors', params: { specialty: suggestedSpecialty } });
    } else {
      router.push('/(tabs)/doctors');
    }
  };

  return (
    <Card className="mx-4 mb-4 overflow-hidden">
      {/* Header */}
      <View className={`px-4 py-3 ${result.severity === 'Severe' ? 'bg-red-50' : result.severity === 'Moderate' ? 'bg-amber-50' : 'bg-green-50'}`}>
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-slate-800 text-base">{t('chat.severity_result')}</Text>
          <SeverityBadge severity={result.severity} />
        </View>
      </View>

      <View className="p-4 gap-4">
        {/* Conditions */}
        {result.conditions.length > 0 && (
          <View className="gap-1">
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('chat.possible_conditions')}</Text>
            {result.conditions.map((c, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <View className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                <Text className="text-slate-700 text-sm">{c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* First Aid */}
        {result.firstAid && (
          <View className="gap-1">
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('chat.first_aid')}</Text>
            <Text className="text-slate-700 text-sm leading-relaxed">{result.firstAid}</Text>
          </View>
        )}

        {/* Disclaimer */}
        <View className="bg-amber-50 rounded-xl p-3">
          <Text className="text-amber-800 text-xs leading-relaxed">{disclaimer}</Text>
        </View>

        {/* CTAs */}
        <View className="gap-2">
          {result.severity === 'Severe' ? (
            <TouchableOpacity
              onPress={() => router.push('/emergency')}
              className="bg-red-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text className="text-white font-bold text-base">{t('chat.go_to_emergency')}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleFindDoctors}
            className="bg-primary-500 rounded-xl py-3 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="search" size={16} color="#fff" />
            <Text className="text-white font-semibold text-base">{t('chat.find_matching_doctors')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}
