import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SearchCategories } from '../utils/search';
import { ensureAtLeastOneCategory } from '../utils/search';

export interface SearchCategoryFiltersProps {
  categories: SearchCategories;
  onChange: (categories: SearchCategories) => void;
}

const FILTERS: { key: keyof SearchCategories; label: string }[] = [
  { key: 'judul', label: 'Judul' },
  { key: 'lirik', label: 'Lirik' },
  { key: 'sumberKarya', label: 'Sumber karya' },
];

export default function SearchCategoryFilters({
  categories,
  onChange,
}: SearchCategoryFiltersProps) {
  const toggle = (key: keyof SearchCategories) => {
    const next = { ...categories, [key]: !categories[key] };
    onChange(ensureAtLeastOneCategory(next));
  };

  return (
    <View className="mx-4 mb-2 flex-row flex-wrap gap-2">
      {FILTERS.map(({ key, label }) => {
        const on = categories[key];
        return (
          <Pressable
            key={key}
            onPress={() => toggle(key)}
            className={`flex-row items-center rounded-lg border px-2.5 py-1.5 ${
              on
                ? 'border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-950'
                : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
            }`}
          >
            <Text
              className={`mr-1.5 text-sm ${on ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}
            >
              {on ? '☑' : '☐'}
            </Text>
            <Text
              className={`text-sm font-medium ${
                on
                  ? 'text-teal-700 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-400'
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
