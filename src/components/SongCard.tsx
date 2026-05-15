import React from 'react';
import { Pressable, Text } from 'react-native';
import type { Song } from '../types/songs';

export interface SongCardProps {
  song: Song;
  onPress: () => void;
  highlight?: boolean;
}

export default function SongCard({ song, onPress, highlight }: SongCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center border-b border-slate-200 px-3.5 py-3 dark:border-slate-700 ${highlight ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
    >
      <Text className="w-11 text-base font-semibold text-slate-500 dark:text-slate-400">
        {song.id}.
      </Text>
      <Text className="flex-1 text-[17px] text-slate-900 dark:text-slate-100" numberOfLines={2}>
        {song.title}
      </Text>
    </Pressable>
  );
}
