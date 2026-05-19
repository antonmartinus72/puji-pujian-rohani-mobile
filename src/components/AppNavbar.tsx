import React, { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTopInset } from '../hooks/useTopInset';

export interface AppNavbarProps {
  title: string;
  onMenu: () => void;
  rightAction?: ReactNode;
}

export default function AppNavbar({ title, onMenu, rightAction }: AppNavbarProps) {
  const topInset = useTopInset();
  const iconColor = '#f8fafc';

  return (
    <View
      className="flex-row items-center border-b border-navBorder bg-nav px-2 pb-2.5"
      style={{ paddingTop: topInset + 8 }}
    >
      <Pressable
        onPress={onMenu}
        className="min-h-[48px] min-w-[48px] items-center justify-center"
        accessibilityLabel="Buka menu"
      >
        <Ionicons name="menu" size={28} color={iconColor} />
      </Pressable>
      <Text
        className="min-w-0 flex-1 text-xl font-bold text-slate-100"
        numberOfLines={1}
      >
        {title}
      </Text>
      {rightAction ? (
        <View className="min-h-[48px] min-w-[48px] items-center justify-center">
          {rightAction}
        </View>
      ) : (
        <View className="min-w-[48px]" />
      )}
    </View>
  );
}
