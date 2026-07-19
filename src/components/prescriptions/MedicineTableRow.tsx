import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SelectField } from '../ui/SelectField';
import { searchMedicines } from '../../services/prescriptions/medicines';
import type { Medicine, MedicineWarning } from '../../services/prescriptions/engineTypes';
import type { PrescriptionItem } from '../../types/prescription';

export interface EditableItem extends PrescriptionItem {
  /** Client-only stable key for list rendering. Stripped before saving. */
  _key: string;
}

interface MedicineTableRowProps {
  row: EditableItem;
  known: boolean;
  warnings: MedicineWarning[];
  timingOptions: string[];
  canRemove: boolean;
  onPatch: (patch: Partial<PrescriptionItem>) => void;
  onRemove: () => void;
  onFocusRow: () => void;
}

export function MedicineTableRow({
  row,
  known,
  warnings,
  timingOptions,
  canRemove,
  onPatch,
  onRemove,
  onFocusRow,
}: MedicineTableRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => (open ? searchMedicines(row.medicineName, 6) : []),
    [open, row.medicineName],
  );

  const pick = (med: Medicine) => {
    onPatch({
      medicineName: med.name,
      genericName: med.generic,
      strength: med.strength,
      timing: row.timing || med.timing,
      instructions: row.instructions || med.caution,
    });
    setOpen(false);
  };

  const danger = warnings.some((w) => w.level === 'danger');
  const caution = warnings.some((w) => w.level === 'caution');
  const status = !row.medicineName.trim() || !known
    ? null
    : danger
      ? { label: t('prescriptions.status_unsafe'), bg: 'bg-red-100', text: 'text-red-700' }
      : caution
        ? { label: t('prescriptions.status_caution'), bg: 'bg-amber-100', text: 'text-amber-700' }
        : { label: `✓ ${t('prescriptions.status_safe')}`, bg: 'bg-green-100', text: 'text-green-700' };

  return (
    <View
      className="flex-row items-start gap-2 py-2"
      style={{ position: 'relative', zIndex: open ? 30 : 1 }}
    >
      {/* Medicine name + autocomplete */}
      <View style={{ flex: 2.4, position: 'relative' }}>
        <TextInput
          value={row.medicineName}
          onChangeText={(text) => {
            onPatch({ medicineName: text, genericName: '', strength: '' });
            setOpen(true);
          }}
          onFocus={() => {
            onFocusRow();
            if (row.medicineName.trim().length >= 2) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('prescriptions.medicine_name_placeholder')}
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 bg-white text-sm"
        />
        {!!row.genericName && (
          <Text className="text-[11px] text-slate-400 mt-0.5 ml-1" numberOfLines={1}>
            {row.genericName}
          </Text>
        )}
        {open && results.length > 0 && (
          <View
            className="absolute left-0 right-0 border border-slate-200 rounded-xl bg-white overflow-hidden"
            style={{ top: '100%', marginTop: 4, zIndex: 40, elevation: 8 }}
          >
            {results.map((med) => (
              <TouchableOpacity
                key={med.name}
                onPress={() => pick(med)}
                className="px-3 py-2 border-b border-slate-100"
              >
                <Text className="text-sm font-semibold text-slate-800">{med.name}</Text>
                <Text className="text-[11px] text-slate-500">
                  {med.generic} · {med.category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Dosage */}
      <View style={{ flex: 1.1 }}>
        <TextInput
          value={row.dosage}
          onChangeText={(dosage) => onPatch({ dosage })}
          onFocus={onFocusRow}
          placeholder="1+1+1"
          placeholderTextColor="#94A3B8"
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 bg-white text-sm text-center"
        />
      </View>

      {/* Duration */}
      <View style={{ flex: 1.1 }}>
        <TextInput
          value={row.durationDays > 0 ? String(row.durationDays) : ''}
          onChangeText={(text) => onPatch({ durationDays: parseInt(text, 10) || 0 })}
          onFocus={onFocusRow}
          placeholder={t('prescriptions.duration_placeholder')}
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 bg-white text-sm text-center"
        />
      </View>

      {/* Instructions (Sig) */}
      <View style={{ flex: 1.6 }}>
        <SelectField
          value={row.timing}
          options={timingOptions}
          placeholder={t('prescriptions.select_placeholder')}
          onChange={(timing) => onPatch({ timing })}
          onOpen={onFocusRow}
        />
      </View>

      {/* Status */}
      <View style={{ flex: 1, alignItems: 'flex-start', paddingTop: 8 }}>
        {status && (
          <View className={`${status.bg} px-2.5 py-1 rounded-full`}>
            <Text className={`${status.text} text-xs font-semibold`}>{status.label}</Text>
          </View>
        )}
      </View>

      {/* Remove */}
      <TouchableOpacity
        onPress={onRemove}
        disabled={!canRemove}
        className="pt-2.5 px-1"
        style={{ opacity: canRemove ? 1 : 0.3 }}
      >
        <Ionicons name="close" size={18} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );
}
