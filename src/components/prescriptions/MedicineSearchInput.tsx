import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/Input';
import { searchMedicines } from '../../services/prescriptions/medicines';
import type { Medicine } from '../../services/prescriptions/engineTypes';

interface MedicineSearchInputProps {
  onSelect: (medicine: Medicine) => void;
}

/** Autocomplete over the bundled medicine registry (2+ characters). */
export function MedicineSearchInput({ onSelect }: MedicineSearchInputProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchMedicines(query, 8), [query]);

  return (
    <View className="gap-1">
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={t('prescriptions.search_medicine')}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {results.length > 0 && (
        <View className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          {results.map((med) => (
            <TouchableOpacity
              key={med.name}
              onPress={() => {
                onSelect(med);
                setQuery('');
              }}
              className="px-4 py-2.5 border-b border-slate-100 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-800">{med.name}</Text>
                <Text className="text-xs text-slate-500">
                  {med.generic} · {med.category}
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={20} color="#0D9488" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
