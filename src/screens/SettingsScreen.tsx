import React from 'react';
import { Switch, Text, View } from 'react-native';
import AppNavbar from '../components/AppNavbar';
import Sidebar from '../components/Sidebar';
import { useAppSidebar } from '../hooks/useAppSidebar';
import { useTheme } from '../context/ThemeContext';
import type { RootStackScreenProps } from '../navigation/types';

export default function SettingsScreen({
  navigation,
}: RootStackScreenProps<'Settings'>) {
  const sidebar = useAppSidebar(navigation);
  const { isDark, setTheme, ready } = useTheme();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <AppNavbar title="Pengaturan" onMenu={sidebar.open} />

      <View className="p-4">
        <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Tampilan
        </Text>
        <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <View className="mr-3 flex-1">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Mode gelap
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tema gelap untuk membaca lirik di ruangan redup
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
            disabled={!ready}
          />
        </View>
      </View>

      <Sidebar {...sidebar.props} />
    </View>
  );
}
