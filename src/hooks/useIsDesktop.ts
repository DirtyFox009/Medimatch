import { Platform, useWindowDimensions } from 'react-native';

/** Desktop-shell breakpoint (Figma desktop frames are 1440px, sidebar kicks in at 1024). */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 1024;
}

/** Grid columns for doctor/card lists: 1 on phones, 2 on tablets, 3 on wide desktop. */
export function useGridColumns(): number {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return 1;
  if (width >= 1440) return 3;
  if (width >= 768) return 2;
  return 1;
}
