import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

const BASE_LABEL = 16;
const BASE_LINE = 20;
const BASE_LINE_HEIGHT = 30;
const BASE_WRAP_MARGIN = 22;
const BASE_LABEL_MARGIN = 8;

export default function LyricBlock({ label, lines, fontScale = 1 }) {
  const s = fontScale;
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
      wrap: {
        marginBottom: Math.round(BASE_WRAP_MARGIN * s),
      },
    }),
    [s]
  );

  return (
    <View style={typography.wrap}>
      {label ? <Text style={typography.label}>{label}</Text> : null}
      {(lines || []).map((line, i) => (
        <Text key={i} style={typography.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}
