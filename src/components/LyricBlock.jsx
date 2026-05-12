import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LyricBlock({ label, lines }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {(lines || []).map((line, i) => (
        <Text key={i} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  line: {
    fontSize: 20,
    lineHeight: 30,
    color: '#0f172a',
  },
});
