import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SelectFieldProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onOpen?: () => void;
}

/** Native: a lightweight dropdown that overlays the options below the field. */
export function SelectField({
  value,
  options,
  placeholder = 'Select…',
  onChange,
  onOpen,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <View style={{ position: 'relative', zIndex: open ? 50 : 1 }}>
      <TouchableOpacity
        onPress={() => {
          setOpen((o) => !o);
          onOpen?.();
        }}
        className="border border-slate-200 rounded-xl px-3 py-2.5 bg-white flex-row items-center justify-between"
      >
        <Text
          className={value ? 'text-slate-800 text-sm' : 'text-slate-400 text-sm'}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748B" />
      </TouchableOpacity>
      {open && (
        <View
          className="absolute left-0 right-0 border border-slate-200 rounded-xl bg-white"
          style={{ top: '100%', marginTop: 4, zIndex: 50, elevation: 8 }}
        >
          {opts.map((o) => (
            <TouchableOpacity
              key={o}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
              className="px-3 py-2.5 border-b border-slate-100"
            >
              <Text className="text-sm text-slate-700">{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
