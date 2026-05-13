import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const WINDOW_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(320, Math.max(260, Math.round(WINDOW_W * 0.82)));

function MenuRow({ icon, label, subtitle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
      ]}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={22} color="#1e3a5f" />
      </View>
      <View style={styles.menuTextCol}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? (
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </Pressable>
  );
}

export default function Sidebar({
  visible,
  onClose,
  onOpenSongList,
  onOpenSetlists,
}) {
  const insets = useSafeAreaInsets();
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
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdropFill, { opacity: backdropOpacity }]}
          />
        </Pressable>
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_W,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={12}
              accessibilityLabel="Tutup menu"
            >
              <Ionicons name="close" size={28} color="#475569" />
            </Pressable>
          </View>
          <Text style={styles.drawerHint}>Pilih tujuan</Text>

          <MenuRow
            icon="list-outline"
            label="Daftar Lagu"
            subtitle="Semua lagu, cari judul/lirik, atau saring nomor"
            onPress={() => {
              onClose();
              onOpenSongList?.();
            }}
          />
          <MenuRow
            icon="albums-outline"
            label="Buat Setlist"
            subtitle="Setlist worship leader"
            onPress={() => {
              onClose();
              onOpenSetlists?.();
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  drawerHint: {
    fontSize: 13,
    color: '#64748b',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  menuRowPressed: {
    backgroundColor: '#f8fafc',
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
