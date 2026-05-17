import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Song } from '../types/songs';
import { formatListTitle, getSongKeyLabel } from '../utils/songDisplay';

export interface SongCardProps {
  song: Song;
  onPress: () => void;
  highlight?: boolean;
}

export default function SongCard({ song, onPress, highlight }: SongCardProps) {
  const keyLabel = getSongKeyLabel(song);

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center border-b border-slate-200 px-3.5 py-3 dark:border-slate-700 ${highlight ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
    >
      <Text className="w-11 text-base font-semibold text-slate-500 dark:text-slate-400">
        {song.id}.
      </Text>
      <View className="min-w-0 flex-1">
        <Text className="text-[17px] text-slate-900 dark:text-slate-100" numberOfLines={2}>
          {formatListTitle(song)}
        </Text>
        {keyLabel ? (
          <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{keyLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
