import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SongCard from '../components/SongCard';
import SearchSongRow from '../components/SearchSongRow';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { searchSongs } from '../utils/search';

function screenTitleForVariant(variant) {
  switch (variant) {
    case 'search':
      return 'Cari Lagu';
    case 'pick':
      return 'Pilih Lagu';
    default:
      return 'Daftar Lagu';
  }
}

export default function SongListScreen({ navigation }) {
  const route = useRoute();
  const { songs, goToId, currentSong } = useSongs();
  const { addSongToSetlist } = useSetlist();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [numQ, setNumQ] = useState('');
  const textInputRef = useRef(null);
  const numInputRef = useRef(null);

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
    const byNumber = (list) => {
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

  const onPickSong = (id) => {
    if (pickSetlistId) {
      addSongToSetlist(pickSetlistId, id);
      navigation.goBack();
      return;
    }
    goToId(id);
    navigation.navigate('Reader');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backRow}
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text style={styles.back}>Kembali</Text>
        </Pressable>
        <Text style={styles.title}>{screenTitle}</Text>
        <Text style={styles.sub}>{songs.length} lagu</Text>
      </View>
      <TextInput
        ref={textInputRef}
        value={q}
        onChangeText={setQ}
        placeholder="Judul atau lirik…"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        returnKeyType="search"
      />
      <TextInput
        ref={numInputRef}
        value={numQ}
        onChangeText={(t) => setNumQ(t.replace(/[^0-9]/g, ''))}
        placeholder="Nomor lagu…"
        placeholderTextColor="#94a3b8"
        style={[styles.input, styles.inputNumber]}
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
              highlight={currentSong && item.id === currentSong.id}
              onPress={() => onPickSong(item.id)}
            />
          )
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {q.trim() || numQ.trim()
              ? 'Tidak ada hasil.'
              : 'Belum ada lagu.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 2,
  },
  back: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  sub: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  input: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  inputNumber: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
  },
});
