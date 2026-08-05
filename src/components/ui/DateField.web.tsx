import React from 'react';

import { View, Text } from 'react-native';

export interface DateFieldProps {
  /** ISO date string, YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  /** ISO bounds for the picker, e.g. max = today for a date of birth. */
  min?: string;
  max?: string;
}

/** Web: the browser-native date picker (`<input type="date">`). */
export function DateField({ value, onChange, label, error, min, max }: DateFieldProps) {
  return (
    <View className="gap-1">
      {!!label && <Text className="text-sm font-medium text-slate-700">{label}</Text>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        style={{
          width: '100%',
          border: `1px solid ${error ? '#F87171' : '#E2E8F0'}`,
          borderRadius: 12,
          padding: '12px 16px',
          color: value ? '#1E293B' : '#94A3B8',
          background: '#fff',
          fontSize: 16,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      {!!error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
