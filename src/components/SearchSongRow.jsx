import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getSearchSnippet } from '../utils/search';

export default function SearchSongRow({ song, textQuery, active, onPress }) {
  const snippet = useMemo(
    () => getSearchSnippet(song, textQuery ?? ''),
    [song, textQuery]
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.num}>{song.id}.</Text>
      <View style={styles.col}>
        <Text style={styles.title} numberOfLines={2}>
          {snippet.titleParts.map((p, i) => (
            <Text key={`t-${i}`} style={p.highlight ? styles.titleHl : undefined}>
              {p.text}
            </Text>
          ))}
        </Text>
        {snippet.lyricParts && snippet.lyricParts.length > 0 ? (
          <Text style={styles.lyricWrap} numberOfLines={3}>
            {snippet.lyricEllipsLeft ? (
              <Text style={styles.lyricMuted}>…</Text>
            ) : null}
            {snippet.lyricParts.map((p, i) => (
              <Text
                key={`l-${i}`}
                style={p.highlight ? styles.lyricHl : styles.lyric}
              >
                {p.text}
              </Text>
            ))}
            {snippet.lyricEllipsRight ? (
              <Text style={styles.lyricMuted}>…</Text>
            ) : null}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowActive: {
    backgroundColor: '#eff6ff',
  },
  pressed: {
    opacity: 0.88,
  },
  num: {
    width: 44,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    paddingTop: 2,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  titleHl: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#fef08a',
  },
  lyricWrap: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  lyric: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  lyricHl: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#334155',
    backgroundColor: '#fef9c3',
  },
  lyricMuted: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
});
