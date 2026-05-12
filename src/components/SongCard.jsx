import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SongCard({ song, onPress, highlight }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        highlight && styles.highlight,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.num}>{song.id}.</Text>
      <Text style={styles.title} numberOfLines={2}>
        {song.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  highlight: {
    backgroundColor: '#eff6ff',
  },
  pressed: {
    opacity: 0.85,
  },
  num: {
    width: 44,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  title: {
    flex: 1,
    fontSize: 17,
    color: '#0f172a',
  },
});
