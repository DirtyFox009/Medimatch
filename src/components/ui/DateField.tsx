import React from 'react';
import { Input } from './Input';

export interface DateFieldProps {
  /** ISO date string, YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
}

/** Native fallback: a plain text field (YYYY-MM-DD). */
export function DateField({ value, onChange }: DateFieldProps) {
  return (
    <Input
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      keyboardType="numbers-and-punctuation"
      autoCapitalize="none"
    />
  );
}
