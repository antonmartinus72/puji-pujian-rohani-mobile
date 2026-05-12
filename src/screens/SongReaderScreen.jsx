import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { setStringAsync } from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  PinchGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LyricBlock, { formatLyricBlockPlainText } from '../components/LyricBlock';
import UpdateBanner from '../components/UpdateBanner';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { KEYS, getItem, setItem } from '../services/storage';

const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 2.25;
/** Semakin kecil, pinch terasa lebih lambat / mudah dikontrol (0.22–0.4 umumnya nyaman). */
const PINCH_DAMPING = 0.28;

function clampFontScale(v) {
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, v));
}

function dampedPinchFactor(rawScale) {
  const delta = rawScale - 1;
  return 1 + delta * PINCH_DAMPING;
}

export default function SongReaderScreen({ navigation }) {
  const {
    songs,
    currentSong,
    currentIndex,
    goNext,
    goPrev,
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
  const [lyricFontScale, setLyricFontScale] = useState(1);
  /** Indeks bagian lirik terpilih (multi-select), selalu diurutkan naik */
  const [selectedLyricIndices, setSelectedLyricIndices] = useState([]);
  const [isPinching, setIsPinching] = useState(false);
  const lyricFontScaleRef = useRef(1);
  const pinchOriginScale = useRef(1);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await getItem(KEYS.LYRIC_FONT_SCALE);
      if (cancelled || raw == null) return;
      const n = parseFloat(raw);
      if (Number.isFinite(n)) {
        const v = clampFontScale(n);
        setLyricFontScale(v);
        lyricFontScaleRef.current = v;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    lyricFontScaleRef.current = lyricFontScale;
  }, [lyricFontScale]);

  useEffect(() => {
    setSelectedLyricIndices([]);
  }, [currentSong?.id]);

  const persistLyricFontScale = useCallback((value) => {
    setItem(KEYS.LYRIC_FONT_SCALE, String(value));
  }, []);

  const onPinchGestureEvent = useCallback((e) => {
    const damped = dampedPinchFactor(e.nativeEvent.scale);
    const next = clampFontScale(pinchOriginScale.current * damped);
    setLyricFontScale(next);
  }, []);

  const onPinchHandlerStateChange = useCallback(
    (e) => {
      const { state, oldState } = e.nativeEvent;
      if (state === State.BEGAN) {
        setIsPinching(true);
        pinchOriginScale.current = lyricFontScaleRef.current;
      }
      if (
        state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED
      ) {
        setIsPinching(false);
      }
      if (oldState === State.ACTIVE) {
        const damped = dampedPinchFactor(e.nativeEvent.scale);
        const next = clampFontScale(pinchOriginScale.current * damped);
        setLyricFontScale(next);
        lyricFontScaleRef.current = next;
        persistLyricFontScale(next);
      }
    },
    [persistLyricFontScale]
  );

  const selectedSet = useMemo(
    () => new Set(selectedLyricIndices),
    [selectedLyricIndices]
  );

  const lyricsBodyForSelection = useMemo(() => {
    if (!currentSong?.lyrics?.length || selectedLyricIndices.length === 0) {
      return '';
    }
    const parts = [];
    for (const idx of selectedLyricIndices) {
      const block = currentSong.lyrics[idx];
      if (!block) continue;
      const t = formatLyricBlockPlainText(block.label, block.lines);
      if (t.trim()) parts.push(t);
    }
    return parts.join('\n\n');
  }, [currentSong, selectedLyricIndices]);

  /** Judul lagu + lirik terpilih (untuk salin / bagikan) */
  const selectionFullText = useMemo(() => {
    if (!currentSong || !lyricsBodyForSelection.trim()) return '';
    const heading = `${currentSong.id}. ${currentSong.title}`;
    return `${heading}\n\n${lyricsBodyForSelection}`;
  }, [currentSong, lyricsBodyForSelection]);

  const allBlocksSelected = useMemo(() => {
    const n = currentSong?.lyrics?.length ?? 0;
    return n > 0 && selectedLyricIndices.length === n;
  }, [currentSong?.lyrics?.length, selectedLyricIndices.length]);

  const toggleLyricIndex = useCallback((idx) => {
    setSelectedLyricIndices((prev) => {
      const s = new Set(prev);
      if (s.has(idx)) s.delete(idx);
      else s.add(idx);
      return [...s].sort((a, b) => a - b);
    });
  }, []);

  const selectAllOrClear = useCallback(() => {
    const n = currentSong?.lyrics?.length ?? 0;
    if (n === 0) return;
    setSelectedLyricIndices((prev) => {
      if (prev.length === n) return [];
      return Array.from({ length: n }, (_, i) => i);
    });
  }, [currentSong?.lyrics?.length]);

  const copySelection = useCallback(async () => {
    if (!selectionFullText.trim()) return;
    try {
      await setStringAsync(selectionFullText);
      Alert.alert('Disalin', 'Teks telah disalin ke papan klip.');
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyalin teks.');
    }
  }, [selectionFullText]);

  const shareSelection = useCallback(async () => {
    if (!selectionFullText.trim()) return;
    const title = currentSong
      ? `${currentSong.id}. ${currentSong.title}`
      : 'Lirik';
    try {
      await Share.share({ message: selectionFullText, title });
    } catch {
      /* dibatalkan pengguna */
    }
  }, [selectionFullText, currentSong]);

  const inSetlist = !!activeSession;
  const canPrev = inSetlist
    ? canSessionPrev
    : songs.length > 0 && currentIndex > 0;
  const canNext = inSetlist
    ? canSessionNext
    : songs.length > 0 && currentIndex < songs.length - 1;
  const onPrev = inSetlist ? sessionPrev : goPrev;
  const onNext = inSetlist ? sessionNext : goNext;

  const openSongListSearch = useCallback(() => {
    navigation.navigate('SongList', { variant: 'search' });
  }, [navigation]);

  const openSongListNumber = useCallback(() => {
    navigation.navigate('SongList', { variant: 'number' });
  }, [navigation]);

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
        onSearch={openSongListSearch}
        onNumberPress={openSongListNumber}
        canPrev={canPrev}
        canNext={canNext}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        scrollEnabled={!isPinching}
        contentContainerStyle={[
          styles.scrollInner,
          {
            paddingBottom:
              insets.bottom +
              24 +
              (selectedLyricIndices.length > 0 ? 88 : 0),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <PinchGestureHandler
          simultaneousHandlers={[scrollRef]}
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <View collapsable={false} style={styles.pinchContent}>
            <Text style={styles.songTitle}>
              {currentSong.id}. {currentSong.title}
            </Text>
            <View style={styles.rule} />
            <Text style={styles.lyricHint}>
              Ketuk beberapa bagian (verse, chorus, …) untuk memilih · cubit dua
              jari untuk zoom teks lirik
            </Text>
            {(currentSong.lyrics || []).map((block, idx) => {
              const sel = selectedSet.has(idx);
              return (
                <LyricBlock
                  key={idx}
                  label={block.label}
                  lines={block.lines}
                  fontScale={lyricFontScale}
                  selected={sel}
                  mergeWithPrev={sel && selectedSet.has(idx - 1)}
                  mergeWithNext={sel && selectedSet.has(idx + 1)}
                  onPress={() => toggleLyricIndex(idx)}
                />
              );
            })}
          </View>
        </PinchGestureHandler>
      </ScrollView>

      {selectedLyricIndices.length > 0 ? (
        <View
          style={[
            styles.selectionBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.selectionIconRow}>
            <Pressable
              style={styles.selectionIconBtn}
              onPress={selectAllOrClear}
              accessibilityLabel={
                allBlocksSelected
                  ? 'Batalkan pilih semua'
                  : 'Pilih semua bagian lirik'
              }
            >
              <Ionicons
                name={allBlocksSelected ? 'checkbox' : 'checkbox-outline'}
                size={26}
                color="#f8fafc"
              />
            </Pressable>
            <Pressable
              style={styles.selectionIconBtn}
              onPress={copySelection}
              accessibilityLabel="Salin teks beserta judul lagu"
            >
              <Ionicons name="copy-outline" size={24} color="#f8fafc" />
            </Pressable>
            <Pressable
              style={styles.selectionIconBtn}
              onPress={shareSelection}
              accessibilityLabel="Bagikan teks beserta judul lagu"
            >
              <Ionicons name="share-outline" size={24} color="#f8fafc" />
            </Pressable>
            <Pressable
              style={styles.selectionIconBtn}
              onPress={() => setSelectedLyricIndices([])}
              accessibilityLabel="Tutup pilihan"
            >
              <Ionicons name="close-outline" size={28} color="#94a3b8" />
            </Pressable>
          </View>
        </View>
      ) : null}

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSongList={() =>
          navigation.navigate('SongList', { variant: 'browse' })
        }
        onOpenSetlists={() => navigation.navigate('Setlists')}
      />
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
  pinchContent: {
    paddingBottom: 8,
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
    marginBottom: 12,
    maxWidth: 200,
  },
  lyricHint: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 16,
  },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e3a5f',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#0f172a',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  selectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  selectionIconBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
