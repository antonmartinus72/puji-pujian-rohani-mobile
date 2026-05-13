import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface NavbarProps {
  songNumber?: number;
  onMenu: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSearch: () => void;
  onNumberPress: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export default function Navbar({
  songNumber,
  onMenu,
  onPrev,
  onNext,
  onSearch,
  onNumberPress,
  canPrev,
  canNext,
}: NavbarProps) {
  const insets = useSafeAreaInsets();
  const iconColor = '#f8fafc';
  const disabledColor = 'rgba(248,250,252,0.35)';

  return (
    <View
      className="flex-row items-center justify-between border-b border-navBorder bg-nav px-1.5 pb-2.5"
      style={{ paddingTop: Math.max(insets.top, 8) }}
    >
      <Pressable
        onPress={onMenu}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
        accessibilityLabel="Buka menu"
      >
        <Ionicons name="menu" size={26} color={iconColor} />
      </Pressable>
      <Pressable
        onPress={onPrev}
        disabled={!canPrev}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
        accessibilityLabel="Lagu sebelumnya"
      >
        <Ionicons
          name="chevron-back"
          size={28}
          color={canPrev ? iconColor : disabledColor}
        />
      </Pressable>
      <Pressable
        onPress={onNumberPress}
        className="min-w-[56px] rounded-lg bg-slate-600 px-3 py-2"
        accessibilityLabel="Masukkan nomor lagu"
      >
        <Text className="text-center text-lg font-bold text-slate-100">
          {songNumber ?? '—'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        disabled={!canNext}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
        accessibilityLabel="Lagu berikutnya"
      >
        <Ionicons
          name="chevron-forward"
          size={28}
          color={canNext ? iconColor : disabledColor}
        />
      </Pressable>
      <Pressable
        onPress={onSearch}
        className="min-h-[44px] min-w-[44px] items-center justify-center"
        accessibilityLabel="Cari lagu"
      >
        <Ionicons name="search" size={24} color={iconColor} />
      </Pressable>
    </View>
  );
}
