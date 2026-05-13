import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SongCard from '../components/SongCard';
import SearchSongRow from '../components/SearchSongRow';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { searchSongs } from '../utils/search';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList, RootStackScreenProps } from '../navigation/types';

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
  const [q, setQ] = useState('');
  const [numQ, setNumQ] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const numInputRef = useRef<TextInput>(null);

  const variant = route.params?.variant ?? 'browse';
  const pickSetlistId =
    variant === 'pick' && route.params?.setlistId
      ? route.params.setlistId
      : undefined;

  const screenTitle = screenTitleForVariant(variant);

  useFocusEffect(
    useCallback(() => {
      setQ('');
      setNumQ('');
      const v = route.params?.variant ?? 'browse';
      const t = setTimeout(() => {
        if (v === 'search') textInputRef.current?.focus();
        else if (v === 'number') numInputRef.current?.focus();
        else if (v === 'pick') textInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(t);
    }, [route.params?.variant, route.params?.setlistId])
  );

  const results = useMemo(() => {
    const qTrim = q.trim();
    const numTrim = numQ.trim();
    const byNumber = (list: typeof songs) => {
      if (!numTrim) return list;
      return list.filter((s) => String(s.id).startsWith(numTrim));
    };
    if (qTrim && numTrim) {
      return byNumber(searchSongs(songs, q));
    }
    if (numTrim) {
      return songs.filter((s) => String(s.id).startsWith(numTrim));
    }
    if (qTrim) {
      return searchSongs(songs, q);
    }
    return songs;
  }, [songs, q, numQ]);

  const showSearchRows = !!q.trim();

  const onPickSong = (id: number) => {
    if (pickSetlistId) {
      addSongToSetlist(pickSetlistId, id);
      navigation.goBack();
      return;
    }
    goToId(id);
    navigation.navigate('Reader');
  };

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text className="text-base font-semibold text-blue-600">Kembali</Text>
        </Pressable>
        <Text className="text-[22px] font-bold text-slate-900">{screenTitle}</Text>
        <Text className="mt-1 text-sm text-slate-500">{songs.length} lagu</Text>
      </View>
      <TextInput
        ref={textInputRef}
        value={q}
        onChangeText={setQ}
        placeholder="Judul atau lirik…"
        placeholderTextColor="#94a3b8"
        className="mx-4 mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900"
        returnKeyType="search"
      />
      <TextInput
        ref={numInputRef}
        value={numQ}
        onChangeText={(t) => setNumQ(t.replace(/[^0-9]/g, ''))}
        placeholder="Nomor lagu…"
        placeholderTextColor="#94a3b8"
        className="mx-4 mb-3 mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xl text-slate-900"
        keyboardType="number-pad"
        returnKeyType="search"
        maxLength={8}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          showSearchRows ? (
            <SearchSongRow
              song={item}
              textQuery={q.trim()}
              active={!!currentSong && item.id === currentSong.id}
              onPress={() => onPickSong(item.id)}
            />
          ) : (
            <SongCard
              song={item}
              highlight={!!currentSong && item.id === currentSong.id}
              onPress={() => onPickSong(item.id)}
            />
          )
        }
        ListEmptyComponent={
          <Text className="mt-6 text-center text-slate-500">
            {q.trim() || numQ.trim() ? 'Tidak ada hasil.' : 'Belum ada lagu.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}
