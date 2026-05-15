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
import { useSongs } from './SongContext';
import { dbSetlistsKey, getDynamicItem, setDynamicItem } from '../services/storage';
import type { WorshipSetlist, SetlistSession } from '../types/setlist';

function newSetlistId(): string {
  return `setlist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function isSetlistsPayload(parsed: unknown): parsed is { setlists: WorshipSetlist[] } {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as { setlists?: unknown };
  return Array.isArray(p.setlists);
}

export interface SetlistContextValue {
  setlists: WorshipSetlist[];
  hydrated: boolean;
  activeSession: SetlistSession | null;
  activeSetlistName: string | null;
  beginSession: (setlistId: string) => boolean;
  endSession: () => void;
  sessionNext: () => void;
  sessionPrev: () => void;
  canSessionNext: boolean;
  canSessionPrev: boolean;
  createSetlist: (name: string) => string | null;
  renameSetlist: (id: string, name: string) => void;
  deleteSetlist: (id: string) => void;
  addSongToSetlist: (setlistId: string, songId: number) => void;
  removeSongAt: (setlistId: string, index: number) => void;
  moveSong: (setlistId: string, index: number, delta: number) => void;
  getSetlist: (id: string | undefined) => WorshipSetlist | null;
  buildShareText: (setlistId: string) => string;
}

const SetlistContext = createContext<SetlistContextValue | null>(null);

export function SetlistProvider({ children }: { children: ReactNode }) {
  const { songs, currentSong, goToId, activeProfile, databaseSwitchToken } =
    useSongs();
  const [setlists, setSetlists] = useState<WorshipSetlist[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeSession, setActiveSession] = useState<SetlistSession | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbIdRef = useRef(activeProfile.id);
  const setlistsRef = useRef(setlists);
  setlistsRef.current = setlists;

  const persistSetlists = useCallback(
    async (dbId: string, list: WorshipSetlist[]) => {
      await setDynamicItem(dbSetlistsKey(dbId), JSON.stringify({ setlists: list }));
    },
    []
  );

  const loadSetlistsForDb = useCallback(async (dbId: string) => {
    const raw = await getDynamicItem(dbSetlistsKey(dbId));
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isSetlistsPayload(parsed)) {
          setSetlists(parsed.setlists);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setSetlists([]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const prevId = dbIdRef.current;
    void (async () => {
      if (hydrated && prevId !== activeProfile.id) {
        await persistSetlists(prevId, setlistsRef.current);
      }
      dbIdRef.current = activeProfile.id;
      await loadSetlistsForDb(activeProfile.id);
      if (!cancelled) {
        setHydrated(true);
        setActiveSession(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activeProfile.id,
    databaseSwitchToken,
    loadSetlistsForDb,
    hydrated,
    persistSetlists,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistSetlists(activeProfile.id, setlists);
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [setlists, hydrated, activeProfile.id, persistSetlists]);

  const getSetlist = useCallback(
    (id: string | undefined) =>
      id ? (setlists.find((s) => s.id === id) ?? null) : null,
    [setlists]
  );

  const endSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const sessionId = activeSession?.setlistId;
  const sessionCursor = activeSession?.cursor;

  useEffect(() => {
    if (!sessionId || !currentSong) return;
    const sl = setlists.find((s) => s.id === sessionId);
    if (!sl) {
      endSession();
      return;
    }
    const sid = Number(currentSong.id);
    const idx = sl.songs.findIndex((n) => Number(n) === sid);
    if (idx === -1) {
      endSession();
      return;
    }
    if (sessionCursor != null && idx !== sessionCursor) {
      setActiveSession((prev) =>
        prev && prev.setlistId === sessionId
          ? { setlistId: prev.setlistId, cursor: idx }
          : prev
      );
    }
  }, [currentSong?.id, sessionId, sessionCursor, setlists, endSession]);

  const beginSession = useCallback(
    (setlistId: string) => {
      const sl = setlists.find((s) => s.id === setlistId);
      if (!sl || !sl.songs.length) return false;
      setActiveSession({ setlistId, cursor: 0 });
      goToId(sl.songs[0]);
      return true;
    },
    [setlists, goToId]
  );

  const sessionNext = useCallback(() => {
    if (!activeSession) return;
    const sl = setlists.find((s) => s.id === activeSession.setlistId);
    if (!sl?.songs.length) return;
    const next = activeSession.cursor + 1;
    if (next >= sl.songs.length) return;
    const nextId = sl.songs[next];
    goToId(nextId);
    setActiveSession({ setlistId: activeSession.setlistId, cursor: next });
  }, [activeSession, setlists, goToId]);

  const sessionPrev = useCallback(() => {
    if (!activeSession) return;
    const sl = setlists.find((s) => s.id === activeSession.setlistId);
    if (!sl?.songs.length) return;
    const prev = activeSession.cursor - 1;
    if (prev < 0) return;
    const prevId = sl.songs[prev];
    goToId(prevId);
    setActiveSession({ setlistId: activeSession.setlistId, cursor: prev });
  }, [activeSession, setlists, goToId]);

  const canSessionNext = useMemo(() => {
    if (!activeSession) return false;
    const sl = setlists.find((s) => s.id === activeSession.setlistId);
    if (!sl?.songs.length) return false;
    return activeSession.cursor < sl.songs.length - 1;
  }, [activeSession, setlists]);

  const canSessionPrev = useMemo(() => {
    if (!activeSession) return false;
    return activeSession.cursor > 0;
  }, [activeSession]);

  const createSetlist = useCallback((name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const id = newSetlistId();
    const item: WorshipSetlist = {
      id,
      name: trimmed,
      createdAt: new Date().toISOString(),
      songs: [],
    };
    setSetlists((prev) => [...prev, item]);
    return id;
  }, []);

  const renameSetlist = useCallback((id: string, name: string) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    setSetlists((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s))
    );
  }, []);

  const deleteSetlist = useCallback((id: string) => {
    setSetlists((prev) => prev.filter((s) => s.id !== id));
    setActiveSession((cur) => (cur?.setlistId === id ? null : cur));
  }, []);

  const addSongToSetlist = useCallback((setlistId: string, songId: number) => {
    const n = Number(songId);
    if (Number.isNaN(n)) return;
    setSetlists((prev) =>
      prev.map((s) => {
        if (s.id !== setlistId) return s;
        if (s.songs.some((x) => Number(x) === n)) return s;
        return { ...s, songs: [...s.songs, n] };
      })
    );
  }, []);

  const removeSongAt = useCallback(
    (setlistId: string, index: number) => {
      setSetlists((prev) => {
        const mapped = prev.map((s) => {
          if (s.id !== setlistId) return s;
          const arr = [...s.songs];
          arr.splice(index, 1);
          return { ...s, songs: arr };
        });
        queueMicrotask(() => {
          setActiveSession((cur) => {
            if (!cur || cur.setlistId !== setlistId) return cur;
            const sl = mapped.find((x) => x.id === setlistId);
            if (!sl?.songs.length) return null;
            let c = cur.cursor;
            if (index < c) c -= 1;
            else if (index === c) c = Math.min(c, sl.songs.length - 1);
            c = Math.max(0, c);
            const at = sl.songs[c];
            if (at != null) goToId(at);
            return { setlistId, cursor: c };
          });
        });
        return mapped;
      });
    },
    [goToId]
  );

  const moveSong = useCallback(
    (setlistId: string, index: number, delta: number) => {
      setSetlists((prev) => {
        const mapped = prev.map((s) => {
          if (s.id !== setlistId) return s;
          const j = index + delta;
          if (j < 0 || j >= s.songs.length) return s;
          const arr = [...s.songs];
          const t = arr[index];
          arr[index] = arr[j]!;
          arr[j] = t!;
          return { ...s, songs: arr };
        });
        queueMicrotask(() => {
          setActiveSession((cur) => {
            if (!cur || cur.setlistId !== setlistId) return cur;
            let c = cur.cursor;
            if (c === index) c = index + delta;
            else if (c === index + delta) c = index;
            const sl = mapped.find((x) => x.id === setlistId);
            if (!sl?.songs.length) return null;
            c = Math.max(0, Math.min(c, sl.songs.length - 1));
            const at = sl.songs[c];
            if (at != null) goToId(at);
            return { setlistId, cursor: c };
          });
        });
        return mapped;
      });
    },
    [goToId]
  );

  const activeSetlistName = useMemo(() => {
    if (!activeSession) return null;
    return getSetlist(activeSession.setlistId)?.name ?? null;
  }, [activeSession, getSetlist]);

  const buildShareText = useCallback(
    (setlistId: string) => {
      const sl = setlists.find((s) => s.id === setlistId);
      if (!sl) return '';
      const lines = sl.songs.map((songId, i) => {
        const song = songs.find((x) => Number(x.id) === Number(songId));
        const title = song ? song.title : '?';
        return `${i + 1}. ${songId} — ${title}`;
      });
      return `${sl.name}\n\n${lines.join('\n')}`;
    },
    [setlists, songs]
  );

  const value = useMemo<SetlistContextValue>(
    () => ({
      setlists,
      hydrated,
      activeSession,
      activeSetlistName,
      beginSession,
      endSession,
      sessionNext,
      sessionPrev,
      canSessionNext,
      canSessionPrev,
      createSetlist,
      renameSetlist,
      deleteSetlist,
      addSongToSetlist,
      removeSongAt,
      moveSong,
      getSetlist,
      buildShareText,
    }),
    [
      setlists,
      hydrated,
      activeSession,
      activeSetlistName,
      beginSession,
      endSession,
      sessionNext,
      sessionPrev,
      canSessionNext,
      canSessionPrev,
      createSetlist,
      renameSetlist,
      deleteSetlist,
      addSongToSetlist,
      removeSongAt,
      moveSong,
      getSetlist,
      buildShareText,
    ]
  );

  return (
    <SetlistContext.Provider value={value}>{children}</SetlistContext.Provider>
  );
}

export function useSetlist(): SetlistContextValue {
  const ctx = useContext(SetlistContext);
  if (!ctx) throw new Error('useSetlist must be used within SetlistProvider');
  return ctx;
}
