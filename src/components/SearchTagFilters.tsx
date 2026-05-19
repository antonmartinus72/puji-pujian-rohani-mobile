import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface SearchTagFiltersProps {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function SearchTagFilters({
  tags,
  selected,
  onChange,
}: SearchTagFiltersProps) {
  if (tags.length === 0) return null;

  const toggle = (tag: string) => {
    const on = selected.includes(tag);
    if (on) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <View className="mx-4 mb-2">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Filter tag
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => {
          const on = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggle(tag)}
              className={`rounded-xl px-3 py-1.5 ${
                on
                  ? 'bg-blue-500 dark:bg-blue-600'
                  : 'border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  on ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
