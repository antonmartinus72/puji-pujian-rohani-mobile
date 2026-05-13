import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { setStringAsync } from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LyricBlock, { formatLyricBlockPlainText } from '../components/LyricBlock';
import UpdateBanner from '../components/UpdateBanner';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import { KEYS, getItem, setItem } from '../services/storage';
import type { RootStackScreenProps } from '../navigation/types';

const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 2.25;
const PINCH_DAMPING = 0.28;

function clampFontScale(v: number): number {
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, v));
}

function dampedPinchFactor(rawScale: number): number {
  const delta = rawScale - 1;
  return 1 + delta * PINCH_DAMPING;
}

export default function SongReaderScreen({
  navigation,
}: RootStackScreenProps<'Reader'>) {
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
  const [selectedLyricIndices, setSelectedLyricIndices] = useState<number[]>([]);
  const [isPinching, setIsPinching] = useState(false);
  const lyricFontScaleRef = useRef(1);
  const pinchOriginScale = useRef(1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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

  const persistLyricFontScale = useCallback((value: number) => {
    void setItem(KEYS.LYRIC_FONT_SCALE, String(value));
  }, []);

  const beginPinch = useCallback(() => {
    setIsPinching(true);
    pinchOriginScale.current = lyricFontScaleRef.current;
  }, []);

  const updatePinchScale = useCallback((scale: number) => {
    const damped = dampedPinchFactor(scale);
    const next = clampFontScale(pinchOriginScale.current * damped);
    lyricFontScaleRef.current = next;
    setLyricFontScale(next);
  }, []);

  const commitPinchScale = useCallback(
    (scale: number) => {
      const damped = dampedPinchFactor(scale);
      const next = clampFontScale(pinchOriginScale.current * damped);
      setLyricFontScale(next);
      lyricFontScaleRef.current = next;
      persistLyricFontScale(next);
    },
    [persistLyricFontScale]
  );

  const endPinchInteraction = useCallback(() => {
    setIsPinching(false);
    persistLyricFontScale(lyricFontScaleRef.current);
  }, [persistLyricFontScale]);

  const selectedSet = useMemo(
    () => new Set(selectedLyricIndices),
    [selectedLyricIndices]
  );

  const lyricsBodyForSelection = useMemo(() => {
    if (!currentSong?.lyrics?.length || selectedLyricIndices.length === 0) {
      return '';
    }
    const parts: string[] = [];
    for (const idx of selectedLyricIndices) {
      const block = currentSong.lyrics[idx];
      if (!block) continue;
      const t = formatLyricBlockPlainText(block.label, block.lines);
      if (t.trim()) parts.push(t);
    }
    return parts.join('\n\n');
  }, [currentSong, selectedLyricIndices]);

  const selectionFullText = useMemo(() => {
    if (!currentSong || !lyricsBodyForSelection.trim()) return '';
    const heading = `${currentSong.id}. ${currentSong.title}`;
    return `${heading}\n\n${lyricsBodyForSelection}`;
  }, [currentSong, lyricsBodyForSelection]);

  const allBlocksSelected = useMemo(() => {
    const n = currentSong?.lyrics?.length ?? 0;
    return n > 0 && selectedLyricIndices.length === n;
  }, [currentSong?.lyrics?.length, selectedLyricIndices.length]);

  const toggleLyricIndex = useCallback((idx: number) => {
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

  const swipeToAdjacentSong = useCallback(
    (translationX: number, velocityX: number) => {
      const minDistance = 72;
      const minSpeed = 420;
      if (translationX <= -minDistance || velocityX <= -minSpeed) {
        if (canNext) onNext();
      } else if (translationX >= minDistance || velocityX >= minSpeed) {
        if (canPrev) onPrev();
      }
    },
    [canNext, canPrev, onNext, onPrev]
  );

  const swipeBetweenSongs = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-40, 40])
        .failOffsetY([-32, 32])
        .onEnd((e, success) => {
          if (!success) return;
          swipeToAdjacentSong(e.translationX, e.velocityX);
        }),
    [swipeToAdjacentSong]
  );

  const pinchZoomLyrics = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onBegin(() => {
          beginPinch();
        })
        .onUpdate((e) => {
          updatePinchScale(e.scale);
        })
        .onEnd((e, success) => {
          if (success) {
            commitPinchScale(e.scale);
          }
        })
        .onFinalize(() => {
          endPinchInteraction();
        }),
    [beginPinch, updatePinchScale, commitPinchScale, endPinchInteraction]
  );

  const openSongListSearch = useCallback(() => {
    navigation.navigate('SongList', { variant: 'search' });
  }, [navigation]);

  const openSongListNumber = useCallback(() => {
    navigation.navigate('SongList', { variant: 'number' });
  }, [navigation]);

  if (!ready || !currentSong) {
    return (
      <View
        className="flex-1 items-center justify-center bg-slate-50"
        style={{ paddingBottom: insets.bottom }}
      >
        <Text className="text-base text-slate-500">Memuat lagu…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {updateMessage ? (
        <Pressable
          className="border-b border-green-300 bg-green-100 px-3.5 py-2.5"
          onPress={() => {
            confirmUpdateSuccess();
          }}
        >
          <Text className="text-[15px] font-semibold text-green-800">
            {updateMessage}
          </Text>
          <Text className="mt-0.5 text-xs text-green-700">Tap untuk tutup</Text>
        </Pressable>
      ) : null}
      <UpdateBanner />
      {inSetlist && activeSetlistName ? (
        <View className="flex-row items-center justify-between border-b border-emerald-200 bg-emerald-50 px-3.5 py-2">
          <View className="mr-3 min-w-0 flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
              Mode setlist
            </Text>
            <Text className="mt-0.5 text-[15px] font-semibold text-emerald-800" numberOfLines={1}>
              {activeSetlistName}
            </Text>
          </View>
          <Pressable
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2"
            onPress={endSession}
          >
            <Text className="text-sm font-bold text-emerald-800">Keluar</Text>
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
      <GestureDetector gesture={swipeBetweenSongs}>
        <View className="flex-1">
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            scrollEnabled={!isPinching}
            removeClippedSubviews={false}
            contentContainerStyle={[
              {
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom:
                  insets.bottom + 24 + (selectedLyricIndices.length > 0 ? 88 : 0),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <GestureDetector gesture={pinchZoomLyrics}>
              <View collapsable={false} className="pb-2">
                <Text className="mb-2 text-[22px] font-bold text-slate-900">
                  {currentSong.id}. {currentSong.title}
                </Text>
                <View className="mb-3 h-px max-w-[200px] bg-slate-300" />
                <Text className="mb-4 text-xs leading-[17px] text-slate-500">
                  Ketuk beberapa bagian (verse, chorus, …) untuk memilih · cubit dua
                  jari untuk zoom teks lirik · geser kiri/kanan untuk lagu
                  berikutnya/sebelumnya
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
            </GestureDetector>
          </ScrollView>
        </View>
      </GestureDetector>

      {selectedLyricIndices.length > 0 ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-navBorder bg-nav px-3 pt-2.5"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row items-center justify-evenly">
            <Pressable
              className="min-h-[48px] min-w-[48px] items-center justify-center px-2"
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
              className="min-h-[48px] min-w-[48px] items-center justify-center px-2"
              onPress={() => void copySelection()}
              accessibilityLabel="Salin teks beserta judul lagu"
            >
              <Ionicons name="copy-outline" size={24} color="#f8fafc" />
            </Pressable>
            <Pressable
              className="min-h-[48px] min-w-[48px] items-center justify-center px-2"
              onPress={() => void shareSelection()}
              accessibilityLabel="Bagikan teks beserta judul lagu"
            >
              <Ionicons name="share-outline" size={24} color="#f8fafc" />
            </Pressable>
            <Pressable
              className="min-h-[48px] min-w-[48px] items-center justify-center px-2"
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
