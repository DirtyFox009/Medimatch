import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SPECIALTIES } from '../../constants/specialties';
import { BD_DIVISIONS } from '../../constants/divisions';
import type { DoctorFilter as DoctorFilterType } from '../../types/doctor';

interface DoctorFilterProps {
  filter: DoctorFilterType;
  onChange: (filter: DoctorFilterType) => void;
}

const FEE_OPTIONS = [0, 500, 1000, 1500, 2000];

export function DoctorFilter({ filter, onChange }: DoctorFilterProps) {
  const { t } = useTranslation();

  return (
    <View className="bg-white border-b border-slate-100 pb-2">
      {/* Specialty chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-3 pb-1">
        <TouchableOpacity
          onPress={() => onChange({ ...filter, specialty: '' })}
          className={`mr-2 px-3 py-1.5 rounded-full border ${!filter.specialty ? 'bg-primary-500 border-primary-500' : 'border-slate-200 bg-white'}`}
        >
          <Text className={`text-sm font-medium ${!filter.specialty ? 'text-white' : 'text-slate-600'}`}>
            {t('doctors.all_specialties')}
          </Text>
        </TouchableOpacity>
        {SPECIALTIES.map((s) => (
          <TouchableOpacity
            key={s.value}
            onPress={() => onChange({ ...filter, specialty: s.value })}
            className={`mr-2 px-3 py-1.5 rounded-full border ${filter.specialty === s.value ? 'bg-primary-500 border-primary-500' : 'border-slate-200 bg-white'}`}
          >
            <Text className={`text-sm font-medium ${filter.specialty === s.value ? 'text-white' : 'text-slate-600'}`}>
              {s.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Division + fee row */}
      <View className="flex-row items-center px-4 pt-2 gap-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <TouchableOpacity
            onPress={() => onChange({ ...filter, division: '' })}
            className={`mr-2 px-3 py-1.5 rounded-full border ${!filter.division ? 'bg-slate-700 border-slate-700' : 'border-slate-200 bg-white'}`}
          >
            <Text className={`text-xs font-medium ${!filter.division ? 'text-white' : 'text-slate-600'}`}>All</Text>
          </TouchableOpacity>
          {BD_DIVISIONS.map((d) => (
            <TouchableOpacity
              key={d.code}
              onPress={() => onChange({ ...filter, division: d.nameEn })}
              className={`mr-2 px-3 py-1.5 rounded-full border ${filter.division === d.nameEn ? 'bg-slate-700 border-slate-700' : 'border-slate-200 bg-white'}`}
            >
              <Text className={`text-xs font-medium ${filter.division === d.nameEn ? 'text-white' : 'text-slate-600'}`}>
                {d.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Telemedicine toggle */}
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text className="text-sm text-slate-600">{t('doctors.telemedicine_only')}</Text>
        <Switch
          value={!!filter.telemedicineOnly}
          onValueChange={(v) => onChange({ ...filter, telemedicineOnly: v })}
          trackColor={{ true: '#0D9488' }}
        />
      </View>
    </View>
  );
}
