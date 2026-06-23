import React, { forwardRef } from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, ...props },
  ref,
) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-slate-700">{label}</Text>}
      <TextInput
        ref={ref}
        className={`border ${error ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-800 bg-white text-base ${className ?? ''}`}
        placeholderTextColor="#94A3B8"
        {...props}
        value={props.value ?? ''}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
});
