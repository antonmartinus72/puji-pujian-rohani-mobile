import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SearchHistoryDropdownProps {
  visible: boolean;
  entries: string[];
  onSelect: (query: string) => void;
}

export default function SearchHistoryDropdown({
  visible,
  entries,
  onSelect,
}: SearchHistoryDropdownProps) {
  if (!visible || entries.length === 0) return null;

  return (
    <View className="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-600 dark:bg-slate-800">
      {entries.map((entry) => (
        <Pressable
          key={entry}
          onPress={() => onSelect(entry)}
          className="flex-row items-center border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-700"
        >
          <Ionicons name="time-outline" size={16} color="#94a3b8" />
          <Text
            className="ml-2 flex-1 text-base text-slate-800 dark:text-slate-200"
            numberOfLines={1}
          >
            {entry}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
