import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import bundledSongs from '../../assets/songs.json';
import { KEYS, getItem } from '../services/storage';
import { checkForUpdate } from '../services/updater';

const SongContext = createContext(null);

function sortSongsById(songs) {
  return [...(songs || [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

export function SongProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [meta, setMeta] = useState({
    version: bundledSongs.version,
    updatedAt: bundledSongs.updatedAt,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);

  const applyPayload = useCallback((data) => {
    const list = sortSongsById(data.songs || []);
    setSongs(list);
    setMeta({
      version: data.version ?? '1.0.0',
      updatedAt: data.updatedAt ?? '',
    });
    setCurrentIndex(0);
  }, []);

  const loadFromStorage = useCallback(async () => {
    const raw = await getItem(KEYS.SONGS_DATA);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.songs && Array.isArray(parsed.songs)) {
          applyPayload(parsed);
          return true;
        }
      } catch {
        /* fallthrough */
      }
    }
    return false;
  }, [applyPayload]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await loadFromStorage();
      if (!cancelled && !ok) {
        applyPayload(bundledSongs);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPayload, loadFromStorage]);

  const runVersionCheck = useCallback(async () => {
    const result = await checkForUpdate();
    if (result.hasUpdate && result.remoteVersion) {
      setPendingUpdate(result.remoteVersion);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    runVersionCheck();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runVersionCheck();
    });
    return () => sub.remove();
  }, [ready, runVersionCheck]);

  const currentSong = songs[currentIndex] ?? null;

  const goToIndex = useCallback(
    (index) => {
      if (!songs.length) return;
      const i = Math.max(0, Math.min(index, songs.length - 1));
      setCurrentIndex(i);
    },
    [songs.length]
  );

  const goToId = useCallback(
    (id) => {
      const idx = songs.findIndex((s) => Number(s.id) === Number(id));
      if (idx >= 0) setCurrentIndex(idx);
    },
    [songs]
  );

  const goNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const dismissUpdateBanner = useCallback(() => {
    setPendingUpdate(null);
  }, []);

  const confirmUpdateSuccess = useCallback(() => {
    setUpdateMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      songs,
      meta,
      ready,
      currentSong,
      currentIndex,
      goNext,
      goPrev,
      goToId,
      goToIndex,
      applyPayload,
      loadFromStorage,
      pendingUpdate,
      dismissUpdateBanner,
      updateMessage,
      setUpdateMessage,
    }),
    [
      songs,
      meta,
      ready,
      currentSong,
      currentIndex,
      goNext,
      goPrev,
      goToId,
      goToIndex,
      applyPayload,
      loadFromStorage,
      pendingUpdate,
      dismissUpdateBanner,
      setUpdateMessage,
      updateMessage,
    ]
  );

  return <SongContext.Provider value={value}>{children}</SongContext.Provider>;
}

export function useSongs() {
  const ctx = useContext(SongContext);
  if (!ctx) throw new Error('useSongs must be used within SongProvider');
  return ctx;
}
