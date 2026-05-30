import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SongListEntry } from '../utils/songListEntries';
import { formatOtherTitlesHint } from '../utils/songDisplay';

export interface SongCardProps {
  entry: SongListEntry;
  onPress: () => void;
  highlight?: boolean;
}

function SongCardInner({ entry, onPress, highlight }: SongCardProps) {
  const otherHint = formatOtherTitlesHint(entry.song, entry.titleIndex);

  const bgClass = highlight
    ? 'bg-blue-100 dark:bg-blue-900'
    : entry.altColorGroup
      ? 'bg-blue-50/60 dark:bg-blue-950/40'
      : '';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center border-b border-slate-200 px-3.5 py-3 dark:border-slate-700 ${bgClass}`}
    >
      <Text className="w-11 text-base font-semibold text-slate-500 dark:text-slate-400">
        {entry.song.id}.
      </Text>
      <View className="min-w-0 flex-1">
        <Text className="text-[17px] text-slate-900 dark:text-slate-100 uppercase" numberOfLines={2}>
          {entry.displayTitle}
        </Text>
        {otherHint ? (
          <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{otherHint}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default React.memo(SongCardInner, (prev, next) =>
  prev.entry.listKey === next.entry.listKey &&
  prev.highlight === next.highlight
);
