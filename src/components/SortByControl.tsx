import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SortMode } from '../utils/songListEntries';

export interface SortByControlProps {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}

const OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Judul' },
];

export default function SortByControl({ value, onChange }: SortByControlProps) {
  return (
    <View className="flex-row rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
      {OPTIONS.map(({ key, label }) => {
        const on = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            className={`px-3 py-3 ${on ? 'bg-blue-500 dark:bg-blue-600' : ''} ${
              key === 'id' ? 'rounded-l-xl' : 'rounded-r-xl'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                on ? 'text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
