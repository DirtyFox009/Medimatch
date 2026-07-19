import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { formatAppointmentDate } from '../../utils/formatDate';
import type { Prescription } from '../../types/prescription';

interface PrescriptionCardProps {
  prescription: Prescription;
  onPress: () => void;
}

/** Compact list card for a doctor-issued prescription. */
export function PrescriptionCard({ prescription, onPress }: PrescriptionCardProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="p-4 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
          <Ionicons name="document-text" size={20} color="#64748B" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-slate-800" numberOfLines={1}>
            {prescription.diagnosis || t('prescriptions.title')}
          </Text>
          <Text className="text-xs text-slate-500" numberOfLines={1}>
            {prescription.doctorNameEn} · {formatAppointmentDate(prescription.date)}
          </Text>
          <Text className="text-xs text-slate-400">
            {t('prescriptions.item_count', { count: prescription.items.length })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </Card>
    </TouchableOpacity>
  );
}
