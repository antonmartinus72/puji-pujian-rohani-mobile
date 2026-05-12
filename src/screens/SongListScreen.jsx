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
import SongCard from '../components/SongCard';
import { useSongs } from '../context/SongContext';
import { searchSongs } from '../utils/search';

export default function SongListScreen({ navigation }) {
  const { songs, goToId, currentSong } = useSongs();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const data = useMemo(() => searchSongs(songs, q), [songs, q]);

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
        <Text style={styles.title}>Semua lagu</Text>
        <Text style={styles.sub}>{songs.length} lagu</Text>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Filter judul atau lirik…"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        returnKeyType="search"
      />
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            highlight={currentSong && item.id === currentSong.id}
            onPress={() => {
              goToId(item.id);
              navigation.navigate('Reader');
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Tidak ada lagu yang cocok.</Text>
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
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
  },
});
