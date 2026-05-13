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

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start border-b border-slate-200 px-3.5 py-3 ${active ? 'bg-blue-50' : ''}`}
    >
      <Text className="w-11 pt-0.5 text-base font-semibold text-slate-500">
        {song.id}.
      </Text>
      <View className="min-w-0 flex-1">
        <Text className="text-[17px] font-semibold text-slate-900" numberOfLines={2}>
          {snippet.titleParts.map((p, i) => (
            <Text
              key={`t-${i}`}
              className={
                p.highlight
                  ? 'bg-yellow-200 text-[17px] font-bold text-slate-900'
                  : 'text-[17px] font-semibold text-slate-900'
              }
            >
              {p.text}
            </Text>
          ))}
        </Text>
        {snippet.lyricParts && snippet.lyricParts.length > 0 ? (
          <Text className="mt-1.5 text-sm leading-5" numberOfLines={3}>
            {snippet.lyricEllipsLeft ? (
              <Text className="text-sm leading-5 text-slate-400">…</Text>
            ) : null}
            {snippet.lyricParts.map((p, i) => (
              <Text
                key={`l-${i}`}
                className={
                  p.highlight
                    ? 'text-sm font-semibold leading-5 text-slate-700 bg-yellow-100'
                    : 'text-sm leading-5 text-slate-500'
                }
              >
                {p.text}
              </Text>
            ))}
            {snippet.lyricEllipsRight ? (
              <Text className="text-sm leading-5 text-slate-400">…</Text>
            ) : null}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
