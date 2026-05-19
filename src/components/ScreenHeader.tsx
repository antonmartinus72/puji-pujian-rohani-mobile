import React, { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTopInset } from '../hooks/useTopInset';
import { useThemeColors } from '../hooks/useThemeColors';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack: () => void;
  children?: ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  children,
}: ScreenHeaderProps) {
  const topInset = useTopInset();
  const colors = useThemeColors();

  return (
    <View
      className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800"
      style={{ paddingTop: topInset + 10 }}
    >
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        className="min-h-[52px] flex-row items-center gap-2"
      >
        <View className="h-11 w-11 items-center justify-center">
          <Ionicons name="chevron-back" size={30} color={colors.iconBack} />
        </View>
        {children ? (
          <View className="min-w-0 flex-1 justify-center">{children}</View>
        ) : (
          <Text
            className="min-w-0 flex-1 text-[26px] font-bold leading-8 text-slate-900 dark:text-slate-100"
            numberOfLines={2}
          >
            {title}
          </Text>
        )}
      </Pressable>
      {subtitle ? (
        <Text className="mt-0.5 pl-[52px] text-base leading-5 text-slate-500 dark:text-slate-400">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
