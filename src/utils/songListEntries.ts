import type { Song } from '../types/songs';
import { getPrimaryTitle } from './songDisplay';
import {
  DEFAULT_SEARCH_CATEGORIES,
  ensureAtLeastOneCategory,
  type SearchCategories,
  type SongSearchIndexMap,
} from './search';

export interface SongListEntry {
  listKey: string;
  song: Song;
  displayTitle: string;
  titleIndex: number;
  sortKey: string;
}

export type SortMode = 'id' | 'title';

export function collectAllTags(songs: Song[]): string[] {
  const set = new Set<string>();
  for (const song of songs) {
    for (const tag of song.tags ?? []) {
      const t = tag.trim();
      if (t) set.add(t);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'id'));
}

export function filterSongsByTags(songs: Song[], selectedTags: string[]): Song[] {
  if (selectedTags.length === 0) return songs;
  const wanted = selectedTags.map((t) => t.toLowerCase());
  return songs.filter((song) => {
    const songTags = (song.tags ?? []).map((t) => t.trim().toLowerCase());
    return wanted.every((tag) => songTags.includes(tag));
  });
}

export function sortListEntries(
  entries: SongListEntry[],
  mode: SortMode
): SongListEntry[] {
  const copy = [...entries];
  if (mode === 'id') {
    return copy.sort(
      (a, b) =>
        a.song.id - b.song.id ||
        a.titleIndex - b.titleIndex ||
        (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0)
    );
  }
  return copy.sort(
    (a, b) =>
      (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0) ||
      a.song.id - b.song.id ||
      a.titleIndex - b.titleIndex
  );
}

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim();
}

export function getNonEmptyTitleSlots(
  song: Song
): { text: string; index: number }[] {
  const slots: { text: string; index: number }[] = [];
  (song.title || []).forEach((t, index) => {
    const trimmed = (t || '').trim();
    if (trimmed) slots.push({ text: trimmed, index });
  });
  return slots;
}

export function expandSongToEntries(song: Song): SongListEntry[] {
  const slots = getNonEmptyTitleSlots(song);
  if (slots.length === 0) {
    return [
      {
        listKey: `${song.id}-0`,
        song,
        displayTitle: '—',
        titleIndex: 0,
        sortKey: '—',
      },
    ];
  }
  return slots.map(({ text, index }) => ({
    listKey: `${song.id}-${index}`,
    song,
    displayTitle: text,
    titleIndex: index,
    sortKey: text.toLowerCase(),
  }));
}

export function expandSongsToEntries(songs: Song[]): SongListEntry[] {
  return songs.flatMap(expandSongToEntries);
}

function songCreditText(song: Song): string {
  return (song.credit || [])
    .map((c) => (c || '').trim())
    .filter(Boolean)
    .join(' ');
}

function songLyricsText(song: Song): string {
  if (!song.lyrics || !Array.isArray(song.lyrics)) return '';
  return song.lyrics
    .map((block) => [block.label, ...(block.lines || [])].join(' '))
    .join(' ');
}

function titleSlotMatches(slot: string, q: string): boolean {
  return slot.toLowerCase().includes(q);
}

function judulMatches(song: Song, q: string, indexMap?: SongSearchIndexMap): boolean {
  const idx = indexMap?.get(song.id);
  if (idx) return idx.titleTextLower.includes(q);
  return getNonEmptyTitleSlots(song).some((s) => titleSlotMatches(s.text, q));
}

function lirikMatches(song: Song, q: string, indexMap?: SongSearchIndexMap): boolean {
  const idx = indexMap?.get(song.id);
  if (idx) return idx.lyricsTextLower.includes(q);
  return songLyricsText(song).toLowerCase().includes(q);
}

function sumberKaryaMatches(song: Song, q: string, indexMap?: SongSearchIndexMap): boolean {
  const idx = indexMap?.get(song.id);
  if (idx) return idx.creditTextLower.includes(q);
  return songCreditText(song).toLowerCase().includes(q);
}

function entriesForSearchMatch(
  song: Song,
  q: string,
  categories: SearchCategories,
  indexMap?: SongSearchIndexMap
): SongListEntry[] {
  const inJudul = categories.judul && judulMatches(song, q, indexMap);
  const inLirik = categories.lirik && lirikMatches(song, q, indexMap);
  const inCredit = categories.sumberKarya && sumberKaryaMatches(song, q, indexMap);

  if (!inJudul && !inLirik && !inCredit) return [];

  if (inJudul) {
    const matching = getNonEmptyTitleSlots(song).filter((s) =>
      titleSlotMatches(s.text, q)
    );
    if (matching.length > 0) {
      return matching.map(({ text, index }) => ({
        listKey: `${song.id}-${index}`,
        song,
        displayTitle: text,
        titleIndex: index,
        sortKey: text.toLowerCase(),
      }));
    }
  }

  const primary = getPrimaryTitle(song);
  const primarySlot = getNonEmptyTitleSlots(song)[0];
  return [
    {
      listKey: `${song.id}-${primarySlot?.index ?? 0}`,
      song,
      displayTitle: primary,
      titleIndex: primarySlot?.index ?? 0,
      sortKey: primary.toLowerCase(),
    },
  ];
}

export function searchSongEntries(
  songs: Song[],
  query: string,
  categories: SearchCategories = DEFAULT_SEARCH_CATEGORIES,
  indexMap?: SongSearchIndexMap
): SongListEntry[] {
  const q = normalizeQuery(query);
  if (!q) return expandSongsToEntries(songs);

  const cats = ensureAtLeastOneCategory(categories);
  const out: SongListEntry[] = [];
  const seen = new Set<string>();

  for (const song of songs) {
    for (const entry of entriesForSearchMatch(song, q, cats, indexMap)) {
      if (seen.has(entry.listKey)) continue;
      seen.add(entry.listKey);
      out.push(entry);
    }
  }
  return out;
}

export function buildListEntries(
  songs: Song[],
  options: {
    textQuery?: string;
    categories?: SearchCategories;
    numberPrefix?: string;
    selectedTags?: string[];
    sortMode?: SortMode;
    indexMap?: SongSearchIndexMap;
  }
): SongListEntry[] {
  const numTrim = (options.numberPrefix ?? '').trim();
  const qTrim = (options.textQuery ?? '').trim();

  let filtered = filterSongsByTags(songs, options.selectedTags ?? []);
  if (numTrim) {
    filtered = filtered.filter((s) => String(s.id).startsWith(numTrim));
  }

  let entries: SongListEntry[];
  if (qTrim) {
    entries = searchSongEntries(filtered, qTrim, options.categories, options.indexMap);
  } else {
    entries = expandSongsToEntries(filtered);
  }

  return sortListEntries(entries, options.sortMode ?? 'id');
}
