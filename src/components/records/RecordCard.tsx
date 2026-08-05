import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MedicalRecord, RecordType } from '../../types/record';

const TYPE_COLORS: Record<RecordType, 'blue' | 'green' | 'amber' | 'teal'> = {
  prescription: 'blue',
  report: 'green',
  scan: 'amber',
  other: 'teal',
};

const TYPE_ICONS: Record<RecordType, string> = {
  prescription: 'document-text',
  report: 'flask',
  scan: 'scan',
  other: 'attach',
};

interface RecordCardProps {
  record: MedicalRecord;
  /** Tapping the card body — e.g. open the attached file. */
  onView?: () => void;
  /** When provided, renders a trash button. */
  onDelete?: () => void;
}

/** Shared medical-record card used on both the patient Records tab and the
 *  doctor's read-only patient-records view. */
export function RecordCard({ record, onView, onDelete }: RecordCardProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity onPress={onView} activeOpacity={onView ? 0.7 : 1} disabled={!onView}>
      <Card className="p-4 flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
          <Ionicons name={TYPE_ICONS[record.type] as any} size={20} color="#64748B" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-slate-800 text-sm" numberOfLines={1}>
            {record.title}
          </Text>
          <Text className="text-slate-500 text-xs">
            {record.date}
            {record.doctorName ? ` · ${record.doctorName}` : ''}
            {record.hospitalName ? ` · ${record.hospitalName}` : ''}
          </Text>
          {record.notes ? (
            <Text className="text-slate-400 text-xs" numberOfLines={2}>
              {record.notes}
            </Text>
          ) : null}
          <Badge label={t(`records.${record.type}`)} color={TYPE_COLORS[record.type]} />
        </View>
        {onDelete ? (
          <TouchableOpacity onPress={onDelete} className="p-1">
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        ) : onView ? (
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}
