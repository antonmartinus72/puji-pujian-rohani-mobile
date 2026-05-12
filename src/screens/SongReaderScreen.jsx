import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

const MIN_ZOOM = 0.85;
const MAX_ZOOM = 2.75;

function clampZoom(v) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));
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

  const animatedScale = useRef(new Animated.Value(1)).current;
  const baseZoomRef = useRef(1);
  const pinchBaseRef = useRef(1);

  useEffect(() => {
    baseZoomRef.current = 1;
    pinchBaseRef.current = 1;
    animatedScale.setValue(1);
  }, [currentSong?.id]);

  const onPinchGestureEvent = useCallback(
    (e) => {
      if (e.nativeEvent.state === State.ACTIVE) {
        const next = clampZoom(pinchBaseRef.current * e.nativeEvent.scale);
        animatedScale.setValue(next);
      }
    },
    [animatedScale]
  );

  const onPinchHandlerStateChange = useCallback(
    (e) => {
      const { state, oldState } = e.nativeEvent;
      if (state === State.BEGAN) {
        pinchBaseRef.current = baseZoomRef.current;
      }
      if (oldState === State.ACTIVE) {
        const s = e.nativeEvent.scale;
        baseZoomRef.current = clampZoom(pinchBaseRef.current * s);
        animatedScale.setValue(baseZoomRef.current);
      }
    },
    [animatedScale]
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
        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <Animated.View
            collapsable={false}
            style={[
              styles.zoomInner,
              { transform: [{ scale: animatedScale }] },
            ]}
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
          </Animated.View>
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
  zoomInner: {
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
    marginBottom: 20,
    maxWidth: 200,
  },
});
