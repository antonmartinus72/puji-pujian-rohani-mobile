import type { Song } from '../types/songs';
import { getPrimaryTitle } from './songDisplay';
import {
  DEFAULT_SEARCH_CATEGORIES,
  ensureAtLeastOneCategory,
  type SearchCategories,
} from './search';

export interface SongListEntry {
  listKey: string;
  song: Song;
  displayTitle: string;
  titleIndex: number;
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
      },
    ];
  }
  return slots.map(({ text, index }) => ({
    listKey: `${song.id}-${index}`,
    song,
    displayTitle: text,
    titleIndex: index,
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

function judulMatches(song: Song, q: string): boolean {
  return getNonEmptyTitleSlots(song).some((s) => titleSlotMatches(s.text, q));
}

function lirikMatches(song: Song, q: string): boolean {
  return songLyricsText(song).toLowerCase().includes(q);
}

function sumberKaryaMatches(song: Song, q: string): boolean {
  return songCreditText(song).toLowerCase().includes(q);
}

function entriesForSearchMatch(
  song: Song,
  q: string,
  categories: SearchCategories
): SongListEntry[] {
  const inJudul = categories.judul && judulMatches(song, q);
  const inLirik = categories.lirik && lirikMatches(song, q);
  const inCredit = categories.sumberKarya && sumberKaryaMatches(song, q);

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
    },
  ];
}

export function searchSongEntries(
  songs: Song[],
  query: string,
  categories: SearchCategories = DEFAULT_SEARCH_CATEGORIES
): SongListEntry[] {
  const q = normalizeQuery(query);
  if (!q) return expandSongsToEntries(songs);

  const cats = ensureAtLeastOneCategory(categories);
  const out: SongListEntry[] = [];
  const seen = new Set<string>();

  for (const song of songs) {
    for (const entry of entriesForSearchMatch(song, q, cats)) {
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
  }
): SongListEntry[] {
  const numTrim = (options.numberPrefix ?? '').trim();
  const qTrim = (options.textQuery ?? '').trim();

  let filtered = songs;
  if (numTrim) {
    filtered = filtered.filter((s) => String(s.id).startsWith(numTrim));
  }

  if (qTrim && numTrim) {
    const matched = searchSongEntries(filtered, qTrim, options.categories);
    return matched;
  }
  if (numTrim && !qTrim) {
    return expandSongsToEntries(filtered);
  }
  if (qTrim) {
    return searchSongEntries(filtered, qTrim, options.categories);
  }
  return expandSongsToEntries(filtered);
}
