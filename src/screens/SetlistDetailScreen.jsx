import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { searchSongs } from '../utils/search';

export default function SetlistDetailScreen({ navigation, route }) {
  const { setlistId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { songs } = useSongs();
  const {
    getSetlist,
    renameSetlist,
    deleteSetlist,
    addSongToSetlist,
    removeSongAt,
    moveSong,
    beginSession,
    buildShareText,
  } = useSetlist();

  const setlist = getSetlist(setlistId);
  const [name, setName] = useState(setlist?.name ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [addQ, setAddQ] = useState('');

  useEffect(() => {
    if (setlist) setName(setlist.name);
  }, [setlist?.name]);

  const addResults = useMemo(() => searchSongs(songs, addQ), [songs, addQ]);

  if (!setlistId || !setlist) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.err}>Setlist tidak ditemukan.</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  function onSaveName() {
    renameSetlist(setlistId, name);
  }

  function onDelete() {
    Alert.alert(
      'Hapus setlist',
      `Hapus "${setlist.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteSetlist(setlistId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  async function onShare() {
    const message = buildShareText(setlistId);
    if (!message.trim()) return;
    try {
      await Share.share({ message, title: setlist.name });
    } catch {
      /* user dismissed */
    }
  }

  function onUseSession() {
    if (!setlist.songs.length) {
      Alert.alert('Setlist kosong', 'Tambahkan lagu terlebih dahulu.');
      return;
    }
    const ok = beginSession(setlistId);
    if (ok) navigation.navigate('Reader');
  }

  const rows = setlist.songs.map((id) => {
    const song = songs.find((s) => Number(s.id) === Number(id));
    return { songId: id, title: song?.title ?? 'Tidak ditemukan' };
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backRow}
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text style={styles.back}>Kembali</Text>
        </Pressable>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={onSaveName}
          onSubmitEditing={onSaveName}
          style={styles.nameInput}
          placeholder="Nama setlist"
        />
        <Text style={styles.hint}>
          Urutan: atas ke bawah. Gunakan panah naik/turun untuk menggeser.
        </Text>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={styles.tool} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.toolText}>Tambah lagu</Text>
        </Pressable>
        <Pressable style={styles.toolSecondary} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color="#334155" />
          <Text style={styles.toolSecondaryText}>Bagikan</Text>
        </Pressable>
      </View>

      <Pressable style={styles.useBtn} onPress={onUseSession}>
        <Text style={styles.useBtnText}>Gunakan sekarang</Text>
        <Text style={styles.useSub}>Prev / next hanya dalam setlist ini</Text>
      </Pressable>

      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.songId}-${index}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada lagu. Tambah dari tombol di atas.</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowNum}>{item.songId}</Text>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Pressable
                style={styles.iconAct}
                disabled={index === 0}
                onPress={() => moveSong(setlistId, index, -1)}
              >
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={index === 0 ? '#cbd5e1' : '#334155'}
                />
              </Pressable>
              <Pressable
                style={styles.iconAct}
                disabled={index === rows.length - 1}
                onPress={() => moveSong(setlistId, index, 1)}
              >
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={
                    index === rows.length - 1 ? '#cbd5e1' : '#334155'
                  }
                />
              </Pressable>
              <Pressable
                style={styles.iconAct}
                onPress={() => removeSongAt(setlistId, index)}
              >
                <Ionicons name="trash-outline" size={20} color="#b91c1c" />
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteText}>Hapus setlist</Text>
        </Pressable>
      </View>

      <Modal
        visible={addOpen}
        animationType="slide"
        onRequestClose={() => setAddOpen(false)}
      >
        <View style={[styles.addRoot, { paddingTop: insets.top }]}>
          <View style={styles.addHeader}>
            <Pressable
              onPress={() => setAddOpen(false)}
              style={styles.addCloseRow}
              hitSlop={12}
            >
              <Ionicons name="close" size={26} color="#475569" />
              <Text style={styles.addCloseLabel}>Tutup</Text>
            </Pressable>
            <Text style={styles.addTitle}>Pilih lagu</Text>
          </View>
          <TextInput
            value={addQ}
            onChangeText={setAddQ}
            placeholder="Cari judul atau lirik…"
            style={styles.addSearch}
          />
          <FlatList
            data={addResults}
            keyExtractor={(s) => String(s.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.addRow}
                onPress={() => {
                  addSongToSetlist(setlistId, item.id);
                  setAddOpen(false);
                  setAddQ('');
                }}
              >
                <Text style={styles.addRowNum}>{item.id}</Text>
                <Text style={styles.addRowTitle}>{item.title}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  err: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  link: {
    textAlign: 'center',
    color: '#2563eb',
    marginTop: 12,
    fontWeight: '600',
  },
  top: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 2,
  },
  back: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  tool: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toolText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  toolSecondary: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toolSecondaryText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 15,
  },
  useBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  useBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#047857',
  },
  useSub: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    minWidth: 36,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconAct: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 15,
  },
  addRoot: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  addCloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addCloseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  addTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  addSearch: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  addRowNum: {
    width: 40,
    fontWeight: '700',
    color: '#64748b',
  },
  addRowTitle: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
});
