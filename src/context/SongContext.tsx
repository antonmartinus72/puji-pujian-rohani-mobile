import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import bundledSongs from '../../assets/songs.json';
import { KEYS, getItem } from '../services/storage';
import { checkForUpdate } from '../services/updater';
import type { RemoteVersionPayload } from '../services/updater';
import type { Song, SongsPayload } from '../types/songs';

function sortSongsById(songs: Song[] | undefined): Song[] {
  return [...(songs || [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

function isSongsPayload(parsed: unknown): parsed is SongsPayload {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as { songs?: unknown };
  return Array.isArray(p.songs);
}

export interface SongContextValue {
  songs: Song[];
  meta: { version: string; updatedAt: string };
  ready: boolean;
  currentSong: Song | null;
  currentIndex: number;
  goNext: () => void;
  goPrev: () => void;
  goToId: (id: number) => void;
  goToIndex: (index: number) => void;
  applyPayload: (data: SongsPayload) => void;
  loadFromStorage: () => Promise<boolean>;
  pendingUpdate: RemoteVersionPayload | null;
  dismissUpdateBanner: () => void;
  confirmUpdateSuccess: () => void;
  updateMessage: string | null;
  setUpdateMessage: (msg: string | null) => void;
}

const SongContext = createContext<SongContextValue | null>(null);

export function SongProvider({ children }: { children: ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [meta, setMeta] = useState({
    version: (bundledSongs as SongsPayload).version,
    updatedAt: (bundledSongs as SongsPayload).updatedAt ?? '',
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<RemoteVersionPayload | null>(
    null
  );
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const applyPayload = useCallback((data: SongsPayload) => {
    const list = sortSongsById(data.songs);
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
        const parsed: unknown = JSON.parse(raw);
        if (isSongsPayload(parsed)) {
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
    void (async () => {
      const ok = await loadFromStorage();
      if (!cancelled && !ok) {
        applyPayload(bundledSongs as SongsPayload);
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
    void runVersionCheck();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runVersionCheck();
    });
    return () => sub.remove();
  }, [ready, runVersionCheck]);

  const currentSong = songs[currentIndex] ?? null;

  const goToIndex = useCallback(
    (index: number) => {
      if (!songs.length) return;
      const i = Math.max(0, Math.min(index, songs.length - 1));
      setCurrentIndex(i);
    },
    [songs.length]
  );

  const goToId = useCallback(
    (id: number) => {
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

  const value = useMemo<SongContextValue>(
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
      confirmUpdateSuccess,
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
      confirmUpdateSuccess,
      updateMessage,
    ]
  );

  return <SongContext.Provider value={value}>{children}</SongContext.Provider>;
}

export function useSongs(): SongContextValue {
  const ctx = useContext(SongContext);
  if (!ctx) throw new Error('useSongs must be used within SongProvider');
  return ctx;
}
