import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated = true, className, children, ...props }: CardProps) {
  return (
    <View
      className={`bg-white rounded-2xl ${elevated ? 'shadow-sm' : ''} ${className ?? ''}`}
      style={elevated ? Platform.select({ web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.08)' }, default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } }) : undefined}
      {...props}
    >
      {children}
    </View>
  );
}
