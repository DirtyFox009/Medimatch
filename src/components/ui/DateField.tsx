import React from 'react';
import { Input } from './Input';

export interface DateFieldProps {
  /** ISO date string, YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  /** Honoured by the web picker only; the native fallback is free text. */
  min?: string;
  max?: string;
}

/** Native fallback: a plain text field (YYYY-MM-DD). */
export function DateField({ value, onChange, label, error }: DateFieldProps) {
  return (
    <Input
      label={label}
      error={error}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      keyboardType="numbers-and-punctuation"
      autoCapitalize="none"
    />
  );
}
