import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Song } from '../types/songs';
import {
  formatCreditLines,
  getAlternateTitleEntries,
  getDisplayTitleAtIndex,
  getSongKeyLabel,
  resolveDisplayTitleIndex,
} from '../utils/songDisplay';
import { useThemeColors } from '../hooks/useThemeColors';

export interface SongReaderMetaProps {
  song: Song;
  titleIndex: number;
  expanded: boolean;
  onToggle: () => void;
}

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {tags.map((tag) => (
        <View
          key={tag}
          className="rounded-xl bg-blue-100 px-3 py-1.5 dark:bg-blue-900"
        >
          <Text className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function SongReaderMeta({
  song,
  titleIndex,
  expanded,
  onToggle,
}: SongReaderMetaProps) {
  const colors = useThemeColors();
  const activeIndex = resolveDisplayTitleIndex(song, titleIndex);
  const displayTitle = getDisplayTitleAtIndex(song, activeIndex).toUpperCase();
  const alternates = getAlternateTitleEntries(song, activeIndex);
  const keyLabel = getSongKeyLabel(song);
  const credits = formatCreditLines(song);
  const tags = song.tags ?? [];

  return (
    <View className="mb-3">
      <Pressable
        onPress={onToggle}
        className="mb-2 flex-row items-center gap-1"
      >
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.iconBack}
        />
        <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {expanded ? 'Sembunyikan informasi lagu' : 'Tampilkan informasi lagu'}
        </Text>
      </Pressable>

      <Text className="text-[22px] font-bold leading-7 text-slate-900 dark:text-slate-100">
        {displayTitle}
      </Text>

      {expanded ? (
        <>
          {alternates.length > 0 ? (
            <View className="mt-3">
              {alternates.map(({ text, index }) => (
                <View key={`alt-${index}`} className="mb-1 flex-row">
                  <Text className="mr-2 text-base text-slate-600 dark:text-slate-400">
                    •
                  </Text>
                  <Text className="flex-1 text-base text-slate-700 dark:text-slate-300">
                    {text}{' '}
                    <Text className="text-sm italic text-slate-500 dark:text-slate-400">
                      (judul alternatif)
                    </Text>
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {keyLabel ? (
            <View className="mt-3 self-start rounded-xl bg-emerald-100 px-3 py-1.5 dark:bg-emerald-900">
              <Text className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Kunci : {keyLabel}
              </Text>
            </View>
          ) : null}

          {credits.length > 0 ? (
            <View className="mt-3">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Kredit
              </Text>
              {credits.map((line, i) => (
                <View key={`credit-${i}`} className="mb-0.5 flex-row">
                  <Text className="mr-2 text-sm text-slate-600 dark:text-slate-400">
                    •
                  </Text>
                  <Text className="flex-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <TagChips tags={tags} />
        </>
      ) : (
        <TagChips tags={tags} />
      )}

      <View className="mt-3 h-px max-w-[200px] bg-slate-300 dark:bg-slate-600" />
    </View>
  );
}
