import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SongCard from '../components/SongCard';
import SearchSongRow from '../components/SearchSongRow';
import SearchCategoryFilters from '../components/SearchCategoryFilters';
import SearchHistoryList from '../components/SearchHistoryList';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { addSearchHistory, loadSearchHistory } from '../services/searchHistory';
import {
  DEFAULT_SEARCH_CATEGORIES,
  type SearchCategories,
} from '../utils/search';
import { buildListEntries } from '../utils/songListEntries';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, RootStackScreenProps } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

function screenTitleForVariant(
  variant: 'browse' | 'search' | 'number' | 'pick' | undefined
) {
  switch (variant) {
    case 'search':
      return 'Cari Lagu';
    case 'pick':
      return 'Pilih Lagu';
    default:
      return 'Daftar Lagu';
  }
}

type SongListRoute = RouteProp<RootStackParamList, 'SongList'>;

export default function SongListScreen({
  navigation,
}: RootStackScreenProps<'SongList'>) {
  const route = useRoute<SongListRoute>();
  const { songs, goToId, currentSong } = useSongs();
  const { addSongToSetlist } = useSetlist();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [q, setQ] = useState('');
  const [numQ, setNumQ] = useState('');
  const [categories, setCategories] = useState<SearchCategories>(
    DEFAULT_SEARCH_CATEGORIES
  );
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [metaExpanded, setMetaExpanded] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const numInputRef = useRef<TextInput>(null);

  const variant = route.params?.variant ?? 'browse';
  const showSearchExtras = variant === 'search' || variant === 'pick';
  const pickSetlistId =
    variant === 'pick' && route.params?.setlistId
      ? route.params.setlistId
      : undefined;

  const screenTitle = screenTitleForVariant(variant);

  const refreshHistory = useCallback(async () => {
    const items = await loadSearchHistory();
    setSearchHistory(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setQ('');
      setNumQ('');
      setCategories(DEFAULT_SEARCH_CATEGORIES);
      setMetaExpanded(false);
      void refreshHistory();
      const v = route.params?.variant ?? 'browse';
      const t = setTimeout(() => {
        if (v === 'search') textInputRef.current?.focus();
        else if (v === 'number') numInputRef.current?.focus();
        else if (v === 'pick') textInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(t);
    }, [route.params?.variant, route.params?.setlistId, refreshHistory])
  );

  const filteredHistory = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return searchHistory;
    return searchHistory.filter((entry) => entry.toLowerCase().includes(needle));
  }, [searchHistory, q]);

  const results = useMemo(
    () =>
      buildListEntries(songs, {
        textQuery: q.trim(),
        numberPrefix: numQ.trim(),
        categories,
      }),
    [songs, q, numQ, categories]
  );

  const showSearchRows = !!q.trim();

  const persistSearchQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      await addSearchHistory(trimmed);
      await refreshHistory();
    },
    [refreshHistory]
  );

  const onPickSong = (id: number, titleIndex?: number) => {
    if (pickSetlistId) {
      addSongToSetlist(pickSetlistId, id);
      navigation.goBack();
      return;
    }
    goToId(id, titleIndex);
    navigation.navigate('Reader');
  };

  const onSearchSubmit = () => {
    void persistSearchQuery(q);
    textInputRef.current?.blur();
  };

  const onHistorySelect = (entry: string) => {
    setQ(entry);
    void persistSearchQuery(entry);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color={colors.iconBack} />
          <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Kembali
          </Text>
        </Pressable>
        <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
          {screenTitle}
        </Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {songs.length} lagu
        </Text>
      </View>
      <TextInput
        ref={textInputRef}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={onSearchSubmit}
        placeholder="Judul atau lirik…"
        placeholderTextColor="#94a3b8"
        className="mx-4 mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        returnKeyType="search"
      />
      {showSearchExtras ? (
        <Pressable
          onPress={() => setMetaExpanded((v) => !v)}
          className="mx-4 mb-1 mt-2 flex-row items-center gap-1"
        >
          <Ionicons
            name={metaExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.iconBack}
          />
          <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {metaExpanded ? 'Sembunyikan opsi pencarian' : 'Tampilkan opsi pencarian'}
          </Text>
        </Pressable>
      ) : null}
      {showSearchExtras && metaExpanded ? (
        <>
          <SearchHistoryList entries={filteredHistory} onSelect={onHistorySelect} />
          <SearchCategoryFilters categories={categories} onChange={setCategories} />
        </>
      ) : null}
      <TextInput
        ref={numInputRef}
        value={numQ}
        onChangeText={(t) => setNumQ(t.replace(/[^0-9]/g, ''))}
        placeholder="Nomor lagu…"
        placeholderTextColor="#94a3b8"
        className="mx-4 mb-3 mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        keyboardType="number-pad"
        returnKeyType="search"
        maxLength={8}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.listKey}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          showSearchRows ? (
            <SearchSongRow
              entry={item}
              textQuery={q.trim()}
              active={!!currentSong && item.song.id === currentSong.id}
              onPress={() => {
                void persistSearchQuery(q);
                onPickSong(item.song.id, item.titleIndex);
              }}
            />
          ) : (
            <SongCard
              entry={item}
              highlight={!!currentSong && item.song.id === currentSong.id}
              onPress={() => onPickSong(item.song.id, item.titleIndex)}
            />
          )
        }
        ListEmptyComponent={
          <Text className="mt-6 text-center text-slate-500 dark:text-slate-400">
            {q.trim() || numQ.trim() ? 'Tidak ada hasil.' : 'Belum ada lagu.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}
