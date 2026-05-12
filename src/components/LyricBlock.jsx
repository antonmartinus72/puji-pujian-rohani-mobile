import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const BASE_LABEL = 16;
const BASE_LINE = 20;
const BASE_LINE_HEIGHT = 30;
/** Jarak vertikal antar bagian (verse / chorus / …) */
const BASE_SECTION_GAP = 14;
const BASE_LABEL_MARGIN = 6;

export function formatLyricBlockPlainText(label, lines) {
  const out = [];
  const lab = label != null ? String(label).trim() : '';
  if (lab) out.push(lab);
  for (const line of lines || []) {
    const t = line != null ? String(line).trim() : '';
    if (t) out.push(t);
  }
  return out.join('\n');
}

export default function LyricBlock({
  label,
  lines,
  fontScale = 1,
  selected = false,
  mergeWithPrev = false,
  mergeWithNext = false,
  onPress,
}) {
  const s = fontScale;
  const sectionGap = Math.round(BASE_SECTION_GAP * s);
  const marginBottom =
    selected && mergeWithNext ? 0 : sectionGap;
  const paddingTop = selected && mergeWithPrev ? 4 : 8;
  const paddingBottom = selected && mergeWithNext ? 4 : 8;

  const typography = useMemo(
    () => ({
      label: {
        fontSize: Math.round(BASE_LABEL * s),
        lineHeight: Math.round(BASE_LABEL * 1.35 * s),
        fontWeight: '600',
        color: '#334155',
        marginBottom: Math.round(BASE_LABEL_MARGIN * s),
      },
      line: {
        fontSize: Math.round(BASE_LINE * s),
        lineHeight: Math.round(BASE_LINE_HEIGHT * s),
        color: '#0f172a',
      },
    }),
    [s]
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        label
          ? `Bagian lirik ${label}. Ketuk untuk menambah atau menghapus dari pilihan.`
          : 'Bagian lirik. Ketuk untuk menambah atau menghapus dari pilihan.'
      }
      style={({ pressed }) => [
        styles.block,
        {
          marginBottom,
          paddingTop,
          paddingBottom,
        },
        selected && styles.blockSelected,
        pressed && !selected && styles.blockPressed,
      ]}
    >
      {label ? <Text style={typography.label}>{label}</Text> : null}
      {(lines || []).map((line, i) => (
        <Text key={i} style={typography.line}>
          {line}
        </Text>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 4,
    marginHorizontal: -4,
  },
  blockSelected: {
    backgroundColor: '#dbeafe',
  },
  blockPressed: {
    backgroundColor: '#f1f5f9',
  },
});
