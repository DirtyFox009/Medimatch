import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import type { PrescriptionItem } from '../../types/prescription';
import type { MedicineWarning } from '../../services/prescriptions/engineTypes';

interface PrescriptionItemRowProps {
  index: number;
  item: PrescriptionItem;
  warnings: MedicineWarning[];
  onChange: (item: PrescriptionItem) => void;
  onRemove: () => void;
  isLast?: boolean;
}

export function PrescriptionItemRow({
  index,
  item,
  warnings,
  onChange,
  onRemove,
  isLast = false,
}: PrescriptionItemRowProps) {
  const { t } = useTranslation();
  return (
    <View className={`gap-2 ${isLast ? '' : 'pb-3 border-b border-slate-100'}`}>
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
          <Ionicons name="medkit-outline" size={20} color="#64748B" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-slate-800">
            {index + 1}. {item.medicineName}
          </Text>
          {!!item.genericName && (
            <Text className="text-xs text-slate-500">{item.genericName}</Text>
          )}
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
        <TouchableOpacity onPress={onRemove} className="p-1">
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            value={item.dosage}
            onChangeText={(dosage) => onChange({ ...item, dosage })}
            placeholder={t('prescriptions.dosage_placeholder')}
            label={t('prescriptions.dosage')}
          />
        </View>
        <View className="w-28">
          <Input
            value={item.durationDays > 0 ? String(item.durationDays) : ''}
            onChangeText={(text) =>
              onChange({ ...item, durationDays: parseInt(text, 10) || 0 })
            }
            placeholder="7"
            keyboardType="numeric"
            label={t('prescriptions.duration_days')}
          />
        </View>
      </View>
      <Input
        value={item.instructions}
        onChangeText={(instructions) => onChange({ ...item, instructions })}
        placeholder={t('prescriptions.instructions')}
      />
    </View>
  );
}
