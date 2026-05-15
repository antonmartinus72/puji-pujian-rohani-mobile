import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import bundledSongs from '../../assets/songs.json';
import {
  type DatabaseId,
  type DatabaseProfile,
  type DatabaseRegistryState,
  clearProfileCache,
  createDefaultProfile,
  loadRegistry,
  setActiveProfileId,
  updateDefaultGithub,
  addCustomProfile,
  removeCustomProfile,
  getProfile,
} from '../services/databaseRegistry';
import type { GithubRepoConfig } from '../utils/githubUrls';
import { dbSongsKey, getDynamicItem } from '../services/storage';
import { checkForUpdate, downloadUpdate } from '../services/updater';
import type { RemoteVersionPayload } from '../services/updater';
import { isSongsPayload } from '../utils/songsPayload';
import type { Song, SongsPayload } from '../types/songs';

function sortSongsById(songs: Song[] | undefined): Song[] {
  return [...(songs || [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

export interface StartupUpdateOffer {
  profile: DatabaseProfile;
  remoteVersion: RemoteVersionPayload;
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
  activeProfile: DatabaseProfile;
  profiles: DatabaseProfile[];
  registryReady: boolean;
  databaseSwitchToken: number;
  switchDatabase: (id: DatabaseId) => Promise<void>;
  refreshRegistry: () => Promise<DatabaseRegistryState>;
  updateDefaultRepo: (github: GithubRepoConfig) => Promise<void>;
  addDatabase: (name: string, github: GithubRepoConfig) => Promise<DatabaseProfile>;
  removeDatabase: (id: DatabaseId) => Promise<void>;
  resetDefaultToBundled: () => Promise<void>;
  checkActiveUpdate: () => Promise<void>;
  downloadActiveUpdate: (remoteVersion: RemoteVersionPayload) => Promise<void>;
  pendingUpdate: RemoteVersionPayload | null;
  dismissUpdateBanner: () => void;
  startupUpdateOffer: StartupUpdateOffer | null;
  clearStartupUpdateOffer: () => void;
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
  const [registryReady, setRegistryReady] = useState(false);
  const [registry, setRegistry] = useState<DatabaseRegistryState | null>(null);
  const [databaseSwitchToken, setDatabaseSwitchToken] = useState(0);
  const [pendingUpdate, setPendingUpdate] = useState<RemoteVersionPayload | null>(
    null
  );
  const [startupUpdateOffer, setStartupUpdateOffer] =
    useState<StartupUpdateOffer | null>(null);
  const startupToastShown = useRef(false);

  const activeProfile = useMemo(() => {
    if (!registry) return createDefaultProfile();
    return getProfile(registry, registry.activeId) ?? createDefaultProfile();
  }, [registry]);

  const profiles = registry?.profiles ?? [];

  const applyPayload = useCallback((data: SongsPayload) => {
    const list = sortSongsById(data.songs);
    setSongs(list);
    setMeta({
      version: data.version ?? '1.0.0',
      updatedAt: data.updatedAt ?? '',
    });
    setCurrentIndex(0);
  }, []);

  const loadProfileSongs = useCallback(
    async (profile: DatabaseProfile): Promise<boolean> => {
      const raw = await getDynamicItem(dbSongsKey(profile.id));
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
      if (profile.kind === 'default') {
        applyPayload(bundledSongs as SongsPayload);
        return true;
      }
      applyPayload({ version: '0.0.0', songs: [] });
      return false;
    },
    [applyPayload]
  );

  const refreshRegistry = useCallback(async () => {
    const state = await loadRegistry();
    setRegistry(state);
    setRegistryReady(true);
    return state;
  }, []);

  const runVersionCheck = useCallback(async (profile: DatabaseProfile) => {
    const result = await checkForUpdate(profile);
    if (result.hasUpdate && result.remoteVersion) {
      setPendingUpdate(result.remoteVersion);
      if (!startupToastShown.current) {
        startupToastShown.current = true;
        setStartupUpdateOffer({
          profile,
          remoteVersion: result.remoteVersion,
        });
      }
    } else {
      setPendingUpdate(null);
    }
    return result;
  }, []);

  const clearStartupUpdateOffer = useCallback(() => {
    setStartupUpdateOffer(null);
  }, []);

  const checkActiveUpdate = useCallback(async () => {
    if (!registry) return;
    const profile = getProfile(registry, registry.activeId);
    if (!profile) return;
    await runVersionCheck(profile);
  }, [registry, runVersionCheck]);

  const downloadActiveUpdate = useCallback(
    async (remoteVersion: RemoteVersionPayload) => {
      if (!registry) return;
      const profile = getProfile(registry, registry.activeId);
      if (!profile) return;
      const data = await downloadUpdate(profile, remoteVersion);
      applyPayload(data);
      setPendingUpdate(null);
      clearStartupUpdateOffer();
    },
    [registry, applyPayload, clearStartupUpdateOffer]
  );

  const switchDatabase = useCallback(
    async (id: DatabaseId) => {
      if (!registry || registry.activeId === id) return;
      const profile = getProfile(registry, id);
      if (!profile) return;
      const state = await setActiveProfileId(id);
      setRegistry(state);
      await loadProfileSongs(profile);
      setDatabaseSwitchToken((t) => t + 1);
      setPendingUpdate(null);
      void runVersionCheck(profile);
    },
    [registry, loadProfileSongs, runVersionCheck]
  );

  const updateDefaultRepo = useCallback(
    async (github: GithubRepoConfig) => {
      const state = await updateDefaultGithub(github);
      setRegistry(state);
    },
    []
  );

  const addDatabase = useCallback(async (name: string, github: GithubRepoConfig) => {
    const { state, profile } = await addCustomProfile(name, github);
    setRegistry(state);
    return profile;
  }, []);

  const removeDatabase = useCallback(
    async (id: DatabaseId) => {
      const state = await removeCustomProfile(id);
      setRegistry(state);
      if (registry?.activeId === id) {
        const profile = getProfile(state, state.activeId);
        if (profile) {
          await loadProfileSongs(profile);
          setDatabaseSwitchToken((t) => t + 1);
        }
      }
    },
    [registry?.activeId, loadProfileSongs]
  );

  const resetDefaultToBundled = useCallback(async () => {
    await clearProfileCache('default');
    const profile = getProfile(registry ?? { activeId: 'default', profiles: [] }, 'default');
    if (profile && registry?.activeId === 'default') {
      applyPayload(bundledSongs as SongsPayload);
    }
    setPendingUpdate(null);
    if (profile) void runVersionCheck(profile);
  }, [registry, applyPayload, runVersionCheck]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const state = await loadRegistry();
      if (cancelled) return;
      setRegistry(state);
      setRegistryReady(true);
      const profile = getProfile(state, state.activeId);
      if (profile) {
        await loadProfileSongs(profile);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfileSongs]);

  useEffect(() => {
    if (!ready || !registry) return;
    const profile = getProfile(registry, registry.activeId);
    if (!profile) return;
    void runVersionCheck(profile);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runVersionCheck(profile);
    });
    return () => sub.remove();
  }, [ready, registry?.activeId, runVersionCheck]);

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
    clearStartupUpdateOffer();
  }, [clearStartupUpdateOffer]);

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
      activeProfile,
      profiles,
      registryReady,
      databaseSwitchToken,
      switchDatabase,
      refreshRegistry,
      updateDefaultRepo,
      addDatabase,
      removeDatabase,
      resetDefaultToBundled,
      checkActiveUpdate,
      downloadActiveUpdate,
      pendingUpdate,
      dismissUpdateBanner,
      startupUpdateOffer,
      clearStartupUpdateOffer,
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
      activeProfile,
      profiles,
      registryReady,
      databaseSwitchToken,
      switchDatabase,
      refreshRegistry,
      updateDefaultRepo,
      addDatabase,
      removeDatabase,
      resetDefaultToBundled,
      checkActiveUpdate,
      downloadActiveUpdate,
      pendingUpdate,
      dismissUpdateBanner,
      startupUpdateOffer,
      clearStartupUpdateOffer,
    ]
  );

  return <SongContext.Provider value={value}>{children}</SongContext.Provider>;
}

export function useSongs(): SongContextValue {
  const ctx = useContext(SongContext);
  if (!ctx) throw new Error('useSongs must be used within SongProvider');
  return ctx;
}
