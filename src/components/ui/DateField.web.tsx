import React from 'react';

export interface DateFieldProps {
  /** ISO date string, YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
}

/** Web: the browser-native date picker (`<input type="date">`). */
export function DateField({ value, onChange }: DateFieldProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '12px 16px',
        color: value ? '#1E293B' : '#94A3B8',
        background: '#fff',
        fontSize: 16,
        outline: 'none',
        fontFamily: 'inherit',
      }}
    />
  );
}
