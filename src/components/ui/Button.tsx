import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-white border border-primary-500 active:bg-primary-50',
  danger: 'bg-red-600 active:bg-red-700',
  ghost: 'bg-transparent active:bg-slate-100',
};

const textClasses: Record<string, string> = {
  primary: 'text-white font-semibold',
  secondary: 'text-primary-500 font-semibold',
  danger: 'text-white font-semibold',
  ghost: 'text-slate-700 font-medium',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-5 py-3 rounded-xl',
  lg: 'px-6 py-4 rounded-xl',
};

const textSizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} flex-row items-center justify-center gap-2 ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#2563EB'} />}
      <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{title}</Text>
    </TouchableOpacity>
  );
}
