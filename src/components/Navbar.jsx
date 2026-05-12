import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Navbar({
  songNumber,
  onMenu,
  onPrev,
  onNext,
  onSearch,
  onNumberPress,
  canPrev,
  canNext,
}) {
  const insets = useSafeAreaInsets();
  const iconColor = '#f8fafc';
  const disabledColor = 'rgba(248,250,252,0.35)';

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 8) }]}>
      <Pressable
        onPress={onMenu}
        style={styles.iconBtn}
        accessibilityLabel="Buka menu"
      >
        <Ionicons name="menu" size={26} color={iconColor} />
      </Pressable>
      <Pressable
        onPress={onPrev}
        disabled={!canPrev}
        style={[styles.iconBtn, !canPrev && styles.disabled]}
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
        style={styles.numberBtn}
        accessibilityLabel="Masukkan nomor lagu"
      >
        <Text style={styles.numberText}>{songNumber ?? '—'}</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        disabled={!canNext}
        style={[styles.iconBtn, !canNext && styles.disabled]}
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
        style={styles.iconBtn}
        accessibilityLabel="Cari lagu"
      >
        <Ionicons name="search" size={24} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 10,
    backgroundColor: '#1e3a5f',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0f172a',
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 1,
  },
  numberBtn: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  numberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
});
