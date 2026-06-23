import React from 'react';
import { View, Text } from 'react-native';
import type { Severity } from '../../types/appointment';

interface SeverityBadgeProps {
  severity: Severity;
}

const severityConfig: Record<Severity, { bg: string; text: string; label: Record<string, string> }> = {
  Mild: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: { en: 'Mild', bn: 'হালকা' },
  },
  Moderate: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: { en: 'Moderate', bn: 'মাঝারি' },
  },
  Severe: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: { en: 'Severe', bn: 'গুরুতর' },
  },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return (
    <View className={`${config.bg} px-3 py-1 rounded-full self-start`}>
      <Text className={`${config.text} text-sm font-semibold`}>{config.label.en}</Text>
    </View>
  );
}

interface BadgeProps {
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'sky';
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  green: { bg: 'bg-green-100', text: 'text-green-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-700' },
};

export function Badge({ label, color = 'blue' }: BadgeProps) {
  const { bg, text } = colorMap[color];
  return (
    <View className={`${bg} px-2.5 py-0.5 rounded-full self-start`}>
      <Text className={`${text} text-xs font-medium`}>{label}</Text>
    </View>
  );
}
