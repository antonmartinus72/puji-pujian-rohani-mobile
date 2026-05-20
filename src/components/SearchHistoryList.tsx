import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SearchHistoryListProps {
  entries: string[];
  onSelect: (query: string) => void;
}

export default function SearchHistoryList({
  entries,
  onSelect,
}: SearchHistoryListProps) {
  return (
    <View className="mx-4 mb-2">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Riwayat pencarian
      </Text>
      {entries.length === 0 ? (
        <Text className="text-sm text-slate-400 dark:text-slate-500">
          Belum ada riwayat.
        </Text>
      ) : (
        entries.slice(0, 5).map((entry) => (
          <Pressable
            key={entry}
            onPress={() => onSelect(entry)}
            className="flex-row items-center border-b border-slate-100 py-2 dark:border-slate-700"
          >
            <Ionicons name="time-outline" size={16} color="#94a3b8" />
            <Text
              className="ml-2 flex-1 text-base text-slate-800 dark:text-slate-200"
              numberOfLines={1}
            >
              {entry}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
