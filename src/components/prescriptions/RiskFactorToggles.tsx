import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PatientRiskFlags } from '../../types/prescription';

interface RiskFactorTogglesProps {
  flags: PatientRiskFlags;
  onChange: (flags: PatientRiskFlags) => void;
}

const RISK_KEYS: { flag: keyof PatientRiskFlags; i18nKey: string }[] = [
  { flag: 'pregnancy', i18nKey: 'risk_pregnancy' },
  { flag: 'renal', i18nKey: 'risk_renal' },
  { flag: 'hepatic', i18nKey: 'risk_hepatic' },
  { flag: 'elderly', i18nKey: 'risk_elderly' },
  { flag: 'pediatric', i18nKey: 'risk_pediatric' },
  { flag: 'asthma', i18nKey: 'risk_asthma' },
  { flag: 'pepticUlcer', i18nKey: 'risk_peptic_ulcer' },
  { flag: 'dengue', i18nKey: 'risk_dengue' },
  { flag: 'ckd', i18nKey: 'risk_ckd' },
  { flag: 'heartDisease', i18nKey: 'risk_heart_disease' },
];

export function RiskFactorToggles({ flags, onChange }: RiskFactorTogglesProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap gap-2">
      {RISK_KEYS.map(({ flag, i18nKey }) => {
        const active = flags[flag];
        return (
          <TouchableOpacity
            key={flag}
            onPress={() => onChange({ ...flags, [flag]: !active })}
            className={`px-3 py-1.5 rounded-full border ${
              active ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-200'
            }`}
          >
            <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-600'}`}>
              {t(`prescriptions.${i18nKey}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
