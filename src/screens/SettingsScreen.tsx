import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import type { RootStackScreenProps } from '../navigation/types';

export default function SettingsScreen({
  navigation,
}: RootStackScreenProps<'Settings'>) {
  const insets = useSafeAreaInsets();
  const { isDark, setTheme, ready } = useTheme();
  const colors = useThemeColors();

  return (
    <View
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top }}
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color={colors.iconBack} />
          <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Kembali
          </Text>
        </Pressable>
        <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
          Pengaturan
        </Text>
      </View>

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
              Perubahan langsung diterapkan tanpa perlu memulai ulang aplikasi.
            </Text>
          </View>
          <Switch
            value={isDark}
            disabled={!ready}
            onValueChange={(v) => void setTheme(v ? 'dark' : 'light')}
            trackColor={{ false: '#cbd5e1', true: '#1e3a5f' }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </View>
  );
}
