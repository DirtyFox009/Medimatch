import React from 'react';
import { View } from 'react-native';

/**
 * Centers screen content at a Figma-desktop-friendly max width on large
 * screens; on phones the max-width never binds, so layouts are unchanged.
 */
export function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  return <View className="w-full max-w-[1136px] flex-1 self-center">{children}</View>;
}
