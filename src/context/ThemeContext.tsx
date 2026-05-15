import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { KEYS, getItem, setItem } from '../services/storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  colorScheme: ThemeMode;
  isDark: boolean;
  ready: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseThemeMode(raw: string | null): ThemeMode {
  return raw === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setColorScheme } = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await getItem(KEYS.THEME_MODE);
      if (cancelled) return;
      const mode = parseThemeMode(saved);
      setThemeMode(mode);
      setColorScheme(mode);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setColorScheme]);

  const setTheme = useCallback(
    async (mode: ThemeMode) => {
      setThemeMode(mode);
      setColorScheme(mode);
      await setItem(KEYS.THEME_MODE, mode);
    },
    [setColorScheme]
  );

  const toggleTheme = useCallback(async () => {
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    await setTheme(next);
  }, [themeMode, setTheme]);

  const isDark = themeMode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: themeMode,
      isDark,
      ready,
      setTheme,
      toggleTheme,
    }),
    [themeMode, isDark, ready, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className={`flex-1 ${isDark ? 'dark' : ''}`}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
