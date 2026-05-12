import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PinchGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LyricBlock from '../components/LyricBlock';
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

/** Meredam scale mentah dari gesture (1 = netral) agar zoom tidak melonjak terlalu cepat. */
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
  const lyricFontScaleRef = useRef(1);
  const pinchOriginScale = useRef(1);

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
        pinchOriginScale.current = lyricFontScaleRef.current;
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
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollInner,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.songTitle}>
          {currentSong.id}. {currentSong.title}
        </Text>
        <View style={styles.rule} />
        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <View collapsable={false} style={styles.lyricsPinchArea}>
            {(currentSong.lyrics || []).map((block, idx) => (
              <LyricBlock
                key={idx}
                label={block.label}
                lines={block.lines}
                fontScale={lyricFontScale}
              />
            ))}
          </View>
        </PinchGestureHandler>
      </ScrollView>

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
  lyricsPinchArea: {
    paddingBottom: 8,
  },
});
