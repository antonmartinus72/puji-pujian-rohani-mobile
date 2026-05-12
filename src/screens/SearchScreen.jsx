import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SearchSongRow from '../components/SearchSongRow';
import { useSongs } from '../context/SongContext';
import { searchSongs } from '../utils/search';

export default function SearchScreen({ navigation }) {
  const { songs, goToId, currentSong } = useSongs();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [numQ, setNumQ] = useState('');

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
    return [];
  }, [songs, q, numQ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>
        <Text style={styles.title}>Cari lagu</Text>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Judul atau lirik…"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        autoFocus
        returnKeyType="search"
      />
      <TextInput
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
        renderItem={({ item }) => (
          <SearchSongRow
            song={item}
            textQuery={q.trim()}
            active={!!currentSong && item.id === currentSong.id}
            onPress={() => {
              goToId(item.id);
              navigation.navigate('Reader');
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {!q.trim() && !numQ.trim()
              ? 'Ketik judul/lirik atau nomor lagu.'
              : 'Tidak ada hasil.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 2,
  },
  backText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
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
    marginTop: 32,
    fontSize: 16,
  },
});
