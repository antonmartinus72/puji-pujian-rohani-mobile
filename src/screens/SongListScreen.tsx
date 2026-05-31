import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, ScrollView } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppNavbar from '../components/AppNavbar';
import Sidebar from '../components/Sidebar';
import SongCard from '../components/SongCard';
import SearchSongRow from '../components/SearchSongRow';
import SearchCategoryFilters from '../components/SearchCategoryFilters';
import SearchHistoryList from '../components/SearchHistoryList';
import SearchTagFilters from '../components/SearchTagFilters';
import SortByControl from '../components/SortByControl';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { useAppSidebar } from '../hooks/useAppSidebar';
import { addSearchHistory, loadSearchHistory } from '../services/searchHistory';
import {
  DEFAULT_SEARCH_CATEGORIES,
  type SearchCategories,
} from '../utils/search';
import {
  buildListEntries,
  collectAllTags,
  type SortMode,
  type SongListEntry,
} from '../utils/songListEntries';
import { MIN_QUERY_LENGTH } from '../utils/searchIndexBuilder';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, RootStackScreenProps } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

type SongListRoute = RouteProp<RootStackParamList, 'SongList'>;

export default function SongListScreen({
  navigation,
}: RootStackScreenProps<'SongList'>) {
  const route = useRoute<SongListRoute>();
  const { songs, goToId, currentSong, searchIndex, persistedIndex } = useSongs();
  const { addSongToSetlist } = useSetlist();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const sidebar = useAppSidebar(navigation);

  const [q, setQ] = useState('');
  const [numQ, setNumQ] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('id');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<SearchCategories>(
    DEFAULT_SEARCH_CATEGORIES
  );
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [metaExpanded, setMetaExpanded] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const numInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<SongListEntry>>(null);

  useEffect(() => {
    setShowAllResults(false);
  }, [q, numQ, selectedTags, categories, sortMode]);

  const variant = route.params?.variant ?? 'list';
  const isPick = variant === 'pick';
  const pickSetlistId =
    isPick && route.params?.setlistId ? route.params.setlistId : undefined;

  const screenTitle = isPick ? 'Pilih Lagu' : 'Daftar Lagu';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const allTags = useMemo(() => collectAllTags(songs), [songs]);

  const refreshHistory = useCallback(async () => {
    const items = await loadSearchHistory();
    setSearchHistory(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setQ('');
      setDebouncedQ('');
      setNumQ('');
      setSortMode('id');
      setSelectedTags([]);
      setCategories(DEFAULT_SEARCH_CATEGORIES);
      setMetaExpanded(false);
      void refreshHistory();
      const t = setTimeout(() => {
        if (route.params?.focusNumber) {
          numInputRef.current?.focus();
        }
      }, 120);
      return () => clearTimeout(t);
    }, [route.params?.focusNumber, route.params?.setlistId, refreshHistory])
  );

  const resetFilters = useCallback(() => {
    setQ('');
    setDebouncedQ('');
    setNumQ('');
    setSortMode('id');
    setSelectedTags([]);
    setCategories(DEFAULT_SEARCH_CATEGORIES);
    setMetaExpanded(false);
    setShowAllResults(false);
  }, []);

  const filteredHistory = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return searchHistory;
    return searchHistory.filter((entry) => entry.toLowerCase().includes(needle));
  }, [searchHistory, q]);

  const results = useMemo(
    () =>
      buildListEntries(songs, {
        textQuery: debouncedQ.trim(),
        numberPrefix: numQ.trim(),
        categories,
        selectedTags,
        sortMode,
        indexMap: searchIndex,
        persistedIndex,
      }),
    [songs, debouncedQ, numQ, categories, selectedTags, sortMode, searchIndex, persistedIndex]
  );

  const showSearchRows = q.trim().length >= MIN_QUERY_LENGTH;
  const isSearching = !!q.trim() || !!numQ.trim() || selectedTags.length > 0 || categories !== DEFAULT_SEARCH_CATEGORIES;
  const displayedResults = (isSearching && !showAllResults) ? results.slice(0, 5) : results;

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
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <AppNavbar
        title={screenTitle}
        onMenu={sidebar.open}
        rightAction={
          !isPick ? (
            <Pressable
              onPress={() => navigation.navigate('Reader')}
              className="min-h-[48px] min-w-[48px] items-center justify-center"
              accessibilityLabel="Menu utama"
            >
              <Ionicons name="home" size={26} color="#f8fafc" />
            </Pressable>
          ) : undefined
        }
      />
      <Text className="px-4 pt-2 text-sm text-slate-500 dark:text-slate-400">
        {isSearching ? `${results.length} ditemukan` : `${songs.length} lagu`}
      </Text>
      <View className="mx-4 mt-2 relative justify-center">
        <TextInput
          ref={textInputRef}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={onSearchSubmit}
          placeholder="Judul atau lirik…"
          placeholderTextColor="#94a3b8"
          className="rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          returnKeyType="search"
        />
        <Pressable
          onPress={onSearchSubmit}
          className="absolute right-0 top-0 bottom-0 w-12 items-center justify-center rounded-r-xl"
          accessibilityLabel="Cari lagu"
        >
          <Ionicons name="search" size={20} color={colors.iconBack} />
        </Pressable>
      </View>
      <Pressable
        onPress={() => setMetaExpanded((v) => !v)}
        className="mx-4 mb-1 mt-2 flex-row items-center gap-1"
      >
        <Ionicons
          name={metaExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.iconBack}
        />
        <Text className="text-sm font-semibold text-teal-600 dark:text-teal-400">
          {metaExpanded ? 'Sembunyikan opsi pencarian' : 'Tampilkan opsi pencarian'}
        </Text>
      </Pressable>
      {metaExpanded ? (
        <ScrollView
          className="max-h-[680px] bg-slate-200 dark:bg-slate-900"
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          <SearchHistoryList entries={filteredHistory} onSelect={onHistorySelect} />
          <SearchCategoryFilters categories={categories} onChange={setCategories} />
          <SearchTagFilters
            tags={allTags}
            selected={selectedTags}
            onChange={setSelectedTags}
          />
        </ScrollView>
      ) : null}
      <View className="mx-4 mb-3 mt-2 flex-row items-stretch gap-2">
        <View className="relative flex-1 justify-center">
          <TextInput
            ref={numInputRef}
            value={numQ}
            onChangeText={(t) => setNumQ(t.replace(/[^0-9]/g, ''))}
            onSubmitEditing={() => numInputRef.current?.blur()}
            placeholder="Nomor lagu…"
            placeholderTextColor="#94a3b8"
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-12 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            keyboardType="number-pad"
            returnKeyType="search"
            maxLength={8}
          />
          <Pressable
            onPress={() => numInputRef.current?.blur()}
            className="absolute right-0 top-0 bottom-0 w-12 items-center justify-center rounded-r-xl"
            accessibilityLabel="Cari nomor lagu"
          >
            <Ionicons name="search" size={20} color={colors.iconBack} />
          </Pressable>
        </View>
        <SortByControl 
          value={sortMode} 
          onChange={(newMode) => {
            setSortMode(newMode);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          }} 
        />
        {isSearching && (
          <Pressable
            onPress={resetFilters}
            className="justify-center rounded-xl border border-red-200 bg-red-50 px-3 dark:border-red-900/50 dark:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40"
            accessibilityLabel="Reset filter"
          >
            <Text className="text-sm font-bold text-red-600 dark:text-red-400">Reset</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={displayedResults}
        keyExtractor={(item) => item.listKey}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
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
            {q.trim() || numQ.trim() || selectedTags.length > 0
              ? 'Tidak ada hasil.'
              : 'Belum ada lagu.'}
          </Text>
        }
        ListFooterComponent={
          isSearching && !showAllResults && results.length > 5 ? (
            <Pressable
              onPress={() => setShowAllResults(true)}
              className="mx-4 my-4 items-center justify-center rounded-xl bg-teal-100 py-3 active:bg-teal-200 dark:bg-teal-900/40 dark:active:bg-teal-900/60"
            >
              <Text className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                Tampilkan hasil lainnya ({results.length - 5} lagu)
              </Text>
            </Pressable>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
      <Sidebar {...sidebar.props} />
    </View>
  );
}
