import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

type IonIconName = ComponentProps<typeof Ionicons>['name'];

const WINDOW_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(320, Math.max(260, Math.round(WINDOW_W * 0.82)));

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  iconMenu,
  iconChevron,
}: {
  icon: IonIconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  iconMenu: string;
  iconChevron: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-t border-slate-100 px-4 py-3.5 active:bg-slate-50 dark:border-slate-700 dark:active:bg-slate-800"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50 dark:bg-slate-700">
        <Ionicons name={icon} size={22} color={iconMenu} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={iconChevron} />
    </Pressable>
  );
}

export interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onOpenSongList?: () => void;
  onOpenSetlists?: () => void;
  onOpenDatabase?: () => void;
  onOpenSettings?: () => void;
}

export default function Sidebar({
  visible,
  onClose,
  onOpenSongList,
  onOpenSetlists,
  onOpenDatabase,
  onOpenSettings,
}: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [modalShown, setModalShown] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-DRAWER_W, 0],
        outputRange: [0, 0.48],
        extrapolate: 'clamp',
      }),
    [translateX]
  );

  useEffect(() => {
    if (visible) {
      setModalShown(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!modalShown) return;
    if (visible) {
      translateX.setValue(-DRAWER_W);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 65,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -DRAWER_W,
        duration: 260,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setModalShown(false);
      });
    }
  }, [visible, modalShown, translateX]);

  if (!modalShown) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className={isDark ? 'dark flex-1' : 'flex-1'}>
        <Pressable className="absolute inset-0" onPress={onClose}>
          <Animated.View
            pointerEvents="none"
            className="absolute inset-0 bg-slate-900"
            style={{ opacity: backdropOpacity }}
          />
        </Pressable>
        <Animated.View
          className="absolute bottom-0 left-0 top-0 border-r border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{
            width: DRAWER_W,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 16,
          }}
        >
          <View className="mb-1 flex-row items-center justify-between px-4">
            <Text className="text-[22px] font-extrabold text-slate-900 dark:text-slate-100">
              Menu
            </Text>
            <Pressable
              onPress={onClose}
              className="p-1"
              hitSlop={12}
              accessibilityLabel="Tutup menu"
            >
              <Ionicons name="close" size={28} color={colors.iconMuted} />
            </Pressable>
          </View>
          <Text className="mb-4 px-4 text-[13px] text-slate-500 dark:text-slate-400">
            Pilih tujuan
          </Text>

          <MenuRow
            icon="list-outline"
            label="Daftar Lagu"
            subtitle="Semua lagu, cari judul/lirik, atau saring nomor"
            iconMenu={colors.iconMenu}
            iconChevron={colors.iconMuted}
            onPress={() => {
              onClose();
              onOpenSongList?.();
            }}
          />
          <MenuRow
            icon="albums-outline"
            label="Daftar Setlist"
            subtitle="Setlist untuk satu sesi acara"
            iconMenu={colors.iconMenu}
            iconChevron={colors.iconMuted}
            onPress={() => {
              onClose();
              onOpenSetlists?.();
            }}
          />
          <MenuRow
            icon="server-outline"
            label="Database"
            subtitle="Sumber data lagu dan pembaruan GitHub"
            iconMenu={colors.iconMenu}
            iconChevron={colors.iconMuted}
            onPress={() => {
              onClose();
              onOpenDatabase?.();
            }}
          />
          <MenuRow
            icon="settings-outline"
            label="Pengaturan"
            subtitle="Tampilan dan mode gelap"
            iconMenu={colors.iconMenu}
            iconChevron={colors.iconMuted}
            onPress={() => {
              onClose();
              onOpenSettings?.();
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
