import React from 'react';

export interface SelectFieldProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onOpen?: () => void;
}

/**
 * Web: a real <input>-backed <select> so the dropdown renders with the
 * browser's native list (no clipping/z-index issues inside the medicine table).
 */
export function SelectField({
  value,
  options,
  placeholder = 'Select…',
  onChange,
  onOpen,
}: SelectFieldProps) {
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onOpen}
      style={{
        width: '100%',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '10px 12px',
        color: value ? '#1E293B' : '#94A3B8',
        background: '#fff',
        fontSize: 14,
        outline: 'none',
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {opts.map((o) => (
        <option key={o} value={o} style={{ color: '#1E293B' }}>
          {o}
        </option>
      ))}
    </select>
  );
}
