import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

const BASE_LABEL = 16;
const BASE_LINE = 20;
const BASE_LINE_HEIGHT = 28;
/** Satu “baris kosong” visual antar bagian (verse / chorus / …) */
const BASE_SECTION_GAP = 10;
const BASE_LABEL_MARGIN = 2;

export function formatLyricBlockPlainText(
  label: string | undefined | null,
  lines: string[] | undefined
): string {
  const out: string[] = [];
  const lab = label != null ? String(label).trim() : '';
  if (lab) out.push(lab);
  for (const line of lines || []) {
    const t = line != null ? String(line).trim() : '';
    if (t) out.push(t);
  }
  return out.join('\n');
}

export interface LyricBlockProps {
  label?: string;
  lines?: string[];
  fontScale?: number;
  selected?: boolean;
  mergeWithPrev?: boolean;
  mergeWithNext?: boolean;
  onPress?: () => void;
}

export default function LyricBlock({
  label,
  lines,
  fontScale = 1,
  selected = false,
  mergeWithPrev = false,
  mergeWithNext = false,
  onPress,
}: LyricBlockProps) {
  const s = fontScale;
  const sectionGap = Math.round(BASE_SECTION_GAP * s);
  const marginBottom = selected && mergeWithNext ? 0 : sectionGap;
  const paddingTop = selected && mergeWithPrev ? 2 : 4;
  const paddingBottom = selected && mergeWithNext ? 2 : 4;

  const nonEmptyLines = useMemo(
    () =>
      (lines || []).filter((line) => {
        const t = line != null ? String(line).trim() : '';
        return t.length > 0;
      }),
    [lines]
  );

  const typography = useMemo(
    () => ({
      label: {
        fontSize: Math.round(BASE_LABEL * s),
        lineHeight: Math.round(BASE_LABEL * 1.35 * s),
        fontWeight: '600' as const,
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
      className="-mx-1"
      style={{ marginBottom }}
    >
      {({ pressed }) => (
        <View
          style={[
            {
              paddingTop,
              paddingBottom,
              paddingHorizontal: 6,
              borderRadius: 8,
              overflow: 'hidden',
            },
            selected
              ? { backgroundColor: '#bfdbfe' }
              : pressed
                ? { backgroundColor: '#f1f5f9' }
                : null,
          ]}
        >
          {label ? <Text style={typography.label}>{label}</Text> : null}
          {nonEmptyLines.map((line, i) => (
            <Text key={i} style={typography.line}>
              {line}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}
