import type { LyricSection, ScaleType, Song, SongsPayload } from '../types/songs';

const ROOT_NOTE_RE = /^[a-g](-sharp|-flat)?$/;

export function normalizeTitle(raw: unknown): string[] {
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) {
    const out: string[] = [];
    for (const item of raw) {
      if (typeof item === 'string') out.push(item);
    }
    return out.length > 0 ? out : [''];
  }
  return [''];
}

export function normalizeCredit(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string') out.push(item);
  }
  return out;
}

export function normalizeRootNote(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const v = raw.trim().toLowerCase();
  return ROOT_NOTE_RE.test(v) ? v : undefined;
}

export function normalizeScaleType(raw: unknown): ScaleType | undefined {
  if (raw === 'major' || raw === 'minor') return raw;
  return undefined;
}

function normalizeLyrics(raw: unknown): LyricSection[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const blocks: LyricSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const b = item as { label?: unknown; lines?: unknown };
    const block: LyricSection = {};
    if (typeof b.label === 'string') block.label = b.label;
    if (Array.isArray(b.lines)) {
      block.lines = b.lines.filter((l): l is string => typeof l === 'string');
    }
    blocks.push(block);
  }
  return blocks.length > 0 ? blocks : undefined;
}

function normalizeTags(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const tags = raw.filter((t): t is string => typeof t === 'string');
  return tags.length > 0 ? tags : undefined;
}

export function normalizeSong(raw: unknown): Song | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  const song: Song = {
    id,
    title: normalizeTitle(r.title),
    credit: normalizeCredit(r.credit),
  };

  const tags = normalizeTags(r.tags);
  if (tags) song.tags = tags;

  const rootNote = normalizeRootNote(r.rootNote);
  if (rootNote) song.rootNote = rootNote;

  const scaleType = normalizeScaleType(r.scaleType);
  if (scaleType) song.scaleType = scaleType;

  const lyrics = normalizeLyrics(r.lyrics);
  if (lyrics) song.lyrics = lyrics;

  return song;
}

export function normalizeSongsPayload(data: SongsPayload): SongsPayload {
  const songs: Song[] = [];
  for (const raw of data.songs || []) {
    const song = normalizeSong(raw);
    if (song) songs.push(song);
  }
  return {
    version: data.version ?? '1.0.0',
    updatedAt: data.updatedAt,
    totalSongs: songs.length,
    songs,
  };
}
