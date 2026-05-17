import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Song } from '../types/songs';
import { getSearchSnippet } from '../utils/search';

export interface SearchSongRowProps {
  song: Song;
  textQuery: string;
  active: boolean;
  onPress: () => void;
}

export default function SearchSongRow({
  song,
  textQuery,
  active,
  onPress,
}: SearchSongRowProps) {
  const snippet = useMemo(
    () => getSearchSnippet(song, textQuery ?? ''),
    [song, textQuery]
  );

  const isCreditSnippet = snippet.matchKind === 'credit';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start border-b border-slate-200 px-3.5 py-3 dark:border-slate-700 ${active ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
    >
      <Text className="w-11 pt-0.5 text-base font-semibold text-slate-500 dark:text-slate-400">
        {song.id}.
      </Text>
      <View className="min-w-0 flex-1">
        <Text
          className="text-[17px] font-semibold text-slate-900 dark:text-slate-100"
          numberOfLines={2}
        >
          {snippet.titleParts.map((p, i) => (
            <Text
              key={`t-${i}`}
              className={
                p.highlight
                  ? 'bg-yellow-200 text-xl font-bold text-slate-900 dark:bg-yellow-900 dark:text-slate-100'
                  : 'text-xl font-semibold text-slate-900 dark:text-slate-100'
              }
            >
              {p.text}
            </Text>
          ))}
        </Text>
        {snippet.secondaryParts && snippet.secondaryParts.length > 0 ? (
          <Text className="mt-1.5 text-sm leading-5" numberOfLines={3}>
            {snippet.secondaryEllipsLeft ? (
              <Text className="text-sm leading-5 text-slate-400">…</Text>
            ) : null}
            {snippet.secondaryParts.map((p, i) => (
              <Text
                key={`s-${i}`}
                className={
                  p.highlight
                    ? isCreditSnippet
                      ? 'text-sm font-semibold leading-5 text-violet-700 bg-violet-100 dark:text-violet-200 dark:bg-violet-900'
                      : 'text-sm font-semibold leading-5 text-slate-700 bg-yellow-100 dark:text-slate-200 dark:bg-yellow-900'
                    : isCreditSnippet
                      ? 'text-sm leading-5 text-violet-500 dark:text-violet-400'
                      : 'text-sm leading-5 text-slate-500 dark:text-slate-400'
                }
              >
                {p.text}
              </Text>
            ))}
            {snippet.secondaryEllipsRight ? (
              <Text className="text-sm leading-5 text-slate-400">…</Text>
            ) : null}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
