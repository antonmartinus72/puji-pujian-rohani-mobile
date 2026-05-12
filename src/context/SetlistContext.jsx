import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSongs } from './SongContext';
import { KEYS, getItem, setItem } from '../services/storage';

const SetlistContext = createContext(null);

function newSetlistId() {
  return `setlist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function SetlistProvider({ children }) {
  const { songs, currentSong, goToId } = useSongs();
  const [setlists, setSetlists] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = await getItem(KEYS.SETLISTS);
      if (cancelled) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.setlists && Array.isArray(parsed.setlists)) {
            setSetlists(parsed.setlists);
          }
        } catch {
          /* ignore */
        }
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setItem(KEYS.SETLISTS, JSON.stringify({ setlists }));
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [setlists, hydrated]);

  const getSetlist = useCallback(
    (id) => setlists.find((s) => s.id === id) ?? null,
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
    (setlistId) => {
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

  const createSetlist = useCallback((name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const id = newSetlistId();
    const item = {
      id,
      name: trimmed,
      createdAt: new Date().toISOString(),
      songs: [],
    };
    setSetlists((prev) => [...prev, item]);
    return id;
  }, []);

  const renameSetlist = useCallback((id, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    setSetlists((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s))
    );
  }, []);

  const deleteSetlist = useCallback((id) => {
    setSetlists((prev) => prev.filter((s) => s.id !== id));
    setActiveSession((cur) => (cur?.setlistId === id ? null : cur));
  }, []);

  const addSongToSetlist = useCallback((setlistId, songId) => {
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

  const removeSongAt = useCallback((setlistId, index) => {
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
  }, [goToId]);

  const moveSong = useCallback((setlistId, index, delta) => {
    setSetlists((prev) => {
      const mapped = prev.map((s) => {
        if (s.id !== setlistId) return s;
        const j = index + delta;
        if (j < 0 || j >= s.songs.length) return s;
        const arr = [...s.songs];
        const t = arr[index];
        arr[index] = arr[j];
        arr[j] = t;
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
  }, [goToId]);

  const activeSetlistName = useMemo(() => {
    if (!activeSession) return null;
    return getSetlist(activeSession.setlistId)?.name ?? null;
  }, [activeSession, getSetlist]);

  const buildShareText = useCallback(
    (setlistId) => {
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

  const value = useMemo(
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

export function useSetlist() {
  const ctx = useContext(SetlistContext);
  if (!ctx) throw new Error('useSetlist must be used within SetlistProvider');
  return ctx;
}
