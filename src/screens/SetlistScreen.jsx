import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSetlist } from '../context/SetlistContext';

export default function SetlistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setlists, hydrated, createSetlist } = useSetlist();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  function submitCreate() {
    const id = createSetlist(newName);
    setNewName('');
    setCreateOpen(false);
    if (id) navigation.navigate('SetlistDetail', { setlistId: id });
  }

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
        <Text style={styles.title}>Daftar Setlist</Text>
        <Text style={styles.sub}>Setlist untuk satu sesi pujian</Text>
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => setCreateOpen(true)}>
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.primaryBtnText}>Buat baru</Text>
      </Pressable>

      {!hydrated ? (
        <Text style={styles.muted}>Memuat…</Text>
      ) : (
        <FlatList
          data={setlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Belum ada setlist. Buat satu untuk mengurutkan lagu ibadah.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('SetlistDetail', { setlistId: item.id })
              }
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.songs?.length ?? 0} lagu
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCreateOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Nama setlist</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Contoh: Ibadah Minggu 12 Jan"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalGhost}
                onPress={() => {
                  setCreateOpen(false);
                  setNewName('');
                }}
              >
                <Text style={styles.modalGhostText}>Batal</Text>
              </Pressable>
              <Pressable style={styles.modalOk} onPress={submitCreate}>
                <Text style={styles.modalOkText}>Simpan</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  primaryBtn: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 14,
    backgroundColor: '#1e3a5f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  muted: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginHorizontal: 24,
    marginTop: 32,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardMeta: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#0f172a',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalGhostText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOk: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalOkText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
