import { useMemo } from 'react';
import { getThemeColors } from '../constants/themeColors';
import { useTheme } from '../context/ThemeContext';

export function useThemeColors() {
  const { isDark } = useTheme();
  return useMemo(() => getThemeColors(isDark), [isDark]);
}
