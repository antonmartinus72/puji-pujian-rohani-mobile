import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppNavbar from '../components/AppNavbar';
import Sidebar from '../components/Sidebar';
import { useAppSidebar } from '../hooks/useAppSidebar';
import { useThemeColors } from '../hooks/useThemeColors';
import type { RootStackScreenProps } from '../navigation/types';

export default function AboutScreen({
  navigation,
}: RootStackScreenProps<'About'>) {
  const sidebar = useAppSidebar(navigation);
  const colors = useThemeColors();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <AppNavbar title="Tentang Aplikasi" onMenu={sidebar.open} />

      <View className="p-4">
        <Pressable
          onPress={() => navigation.navigate('Disclaimer')}
          className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700/50"
        >
          <View className="mr-3 flex-1 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-[10px] bg-amber-50 dark:bg-slate-700">
              <Ionicons name="document-text-outline" size={22} color={colors.iconMenu} />
            </View>
            <View>
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Disclaimer & Syarat Penggunaan
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Syarat dan ketentuan aplikasi
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.iconMuted} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('AboutDetail')}
          className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700/50"
        >
          <View className="mr-3 flex-1 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 dark:bg-slate-700">
              <Ionicons name="information-circle-outline" size={22} color={colors.iconMenu} />
            </View>
            <View>
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tentang Aplikasi & Kontak
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Informasi pengembang
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.iconMuted} />
        </Pressable>
      </View>

      <Sidebar {...sidebar.props} />
    </View>
  );
}
