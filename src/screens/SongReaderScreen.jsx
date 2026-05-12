import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LyricBlock from '../components/LyricBlock';
import UpdateBanner from '../components/UpdateBanner';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';

export default function SongReaderScreen({ navigation }) {
  const {
    songs,
    currentSong,
    currentIndex,
    goNext,
    goPrev,
    goToId,
    ready,
    updateMessage,
    confirmUpdateSuccess,
  } = useSongs();
  const {
    activeSession,
    activeSetlistName,
    endSession,
    sessionNext,
    sessionPrev,
    canSessionNext,
    canSessionPrev,
  } = useSetlist();
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [numberOpen, setNumberOpen] = useState(false);
  const [numberInput, setNumberInput] = useState('');

  const inSetlist = !!activeSession;
  const canPrev = inSetlist
    ? canSessionPrev
    : songs.length > 0 && currentIndex > 0;
  const canNext = inSetlist
    ? canSessionNext
    : songs.length > 0 && currentIndex < songs.length - 1;
  const onPrev = inSetlist ? sessionPrev : goPrev;
  const onNext = inSetlist ? sessionNext : goNext;

  const openNumberModal = useCallback(() => {
    setNumberInput(currentSong ? String(currentSong.id) : '');
    setNumberOpen(true);
  }, [currentSong]);

  const submitNumber = useCallback(() => {
    const n = parseInt(numberInput, 10);
    if (!Number.isNaN(n)) goToId(n);
    setNumberOpen(false);
  }, [numberInput, goToId]);

  if (!ready || !currentSong) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <Text style={styles.muted}>Memuat lagu…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {updateMessage ? (
        <Pressable
          style={styles.successBanner}
          onPress={() => {
            confirmUpdateSuccess();
          }}
        >
          <Text style={styles.successText}>{updateMessage}</Text>
          <Text style={styles.successDismiss}>Tap untuk tutup</Text>
        </Pressable>
      ) : null}
      <UpdateBanner />
      {inSetlist && activeSetlistName ? (
        <View style={styles.setlistBanner}>
          <View style={styles.setlistBannerText}>
            <Text style={styles.setlistLabel}>Mode setlist</Text>
            <Text style={styles.setlistName} numberOfLines={1}>
              {activeSetlistName}
            </Text>
          </View>
          <Pressable style={styles.setlistExit} onPress={endSession}>
            <Text style={styles.setlistExitText}>Keluar</Text>
          </Pressable>
        </View>
      ) : null}
      <Navbar
        songNumber={currentSong.id}
        onMenu={() => setSidebarOpen(true)}
        onPrev={onPrev}
        onNext={onNext}
        onSearch={() => navigation.navigate('Search')}
        onNumberPress={openNumberModal}
        canPrev={canPrev}
        canNext={canNext}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.songTitle}>
          {currentSong.id}. {currentSong.title}
        </Text>
        <View style={styles.rule} />
        {(currentSong.lyrics || []).map((block, idx) => (
          <LyricBlock
            key={idx}
            label={block.label}
            lines={block.lines}
          />
        ))}
      </ScrollView>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSongList={() => navigation.navigate('SongList')}
        onOpenSearch={() => navigation.navigate('Search')}
        onOpenSetlists={() => navigation.navigate('Setlists')}
        onOpenNumberPicker={openNumberModal}
      />

      <Modal
        visible={numberOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNumberOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setNumberOpen(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Nomor lagu</Text>
            <TextInput
              value={numberInput}
              onChangeText={setNumberInput}
              keyboardType="number-pad"
              placeholder="Contoh: 42"
              style={styles.modalInput}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={submitNumber}
            />
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalBtnGhost}
                onPress={() => setNumberOpen(false)}
              >
                <Text style={styles.modalBtnGhostText}>Batal</Text>
              </Pressable>
              <Pressable style={styles.modalBtn} onPress={submitNumber}>
                <Text style={styles.modalBtnText}>Buka</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  muted: {
    fontSize: 16,
    color: '#64748b',
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#86efac',
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  successDismiss: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2,
  },
  setlistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#a7f3d0',
  },
  setlistBannerText: {
    flex: 1,
    marginRight: 12,
  },
  setlistLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setlistName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
    marginTop: 2,
  },
  setlistExit: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  setlistExitText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  rule: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginBottom: 20,
    maxWidth: 200,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
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
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnGhostText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBtn: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
