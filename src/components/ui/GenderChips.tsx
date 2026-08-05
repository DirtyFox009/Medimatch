import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Gender } from '../../types/user';

const GENDERS: Gender[] = ['male', 'female', 'other'];

const ACCENT = {
  blue: 'bg-primary-500 border-primary-500',
  teal: 'bg-teal-600 border-teal-600',
};

export interface GenderChipsProps {
  /** '' / null renders with nothing selected. */
  value: Gender | '' | null;
  onChange: (gender: Gender) => void;
  label?: string;
  error?: string;
  /** Patient app is blue; doctor portal is teal. */
  accent?: keyof typeof ACCENT;
}

/** Male/Female/Other chip row — shared by registration, the patient profile and the Rx form. */
export function GenderChips({ value, onChange, label, error, accent = 'blue' }: GenderChipsProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-1">
      {!!label && <Text className="text-sm font-medium text-slate-700">{label}</Text>}
      <View className="flex-row gap-2">
        {GENDERS.map((g) => {
          const active = value === g;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => onChange(g)}
              className={`px-3 py-1.5 rounded-full border ${
                active ? ACCENT[accent] : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-600'}`}>
                {t(`prescriptions.gender_${g}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!!error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
