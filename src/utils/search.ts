import type { Song } from '../types/songs';
import { getPrimaryTitle } from './songDisplay';

function normalize(s: string | undefined | null): string {
  return (s || '').toLowerCase().trim();
}

export interface SearchCategories {
  judul: boolean;
  lirik: boolean;
  sumberKarya: boolean;
}

export const DEFAULT_SEARCH_CATEGORIES: SearchCategories = {
  judul: true,
  lirik: true,
  sumberKarya: false,
};

export function ensureAtLeastOneCategory(categories: SearchCategories): SearchCategories {
  if (categories.judul || categories.lirik || categories.sumberKarya) {
    return categories;
  }
  return { ...categories, judul: true };
}

function songTitleText(song: Song): string {
  return (song.title || [])
    .map((t) => (t || '').trim())
    .filter(Boolean)
    .join(' ');
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

function matchesCategory(
  song: Song,
  q: string,
  categories: SearchCategories
): boolean {
  if (categories.judul && normalize(songTitleText(song)).includes(q)) return true;
  if (categories.lirik && normalize(songLyricsText(song)).includes(q)) return true;
  if (categories.sumberKarya && normalize(songCreditText(song)).includes(q)) return true;
  return false;
}

export function searchSongs(
  songs: Song[],
  query: string,
  categories: SearchCategories = DEFAULT_SEARCH_CATEGORIES
): Song[] {
  const q = normalize(query);
  if (!q) return songs;

  const cats = ensureAtLeastOneCategory(categories);

  return songs.filter((song) => matchesCategory(song, q, cats));
}

export interface MatchPart {
  text: string;
  highlight: boolean;
}

export function splitMatchParts(
  text: string | null | undefined,
  queryNormalized: string
): MatchPart[] {
  const original = text == null ? '' : String(text);
  const q = queryNormalized || '';
  if (!q) return [{ text: original, highlight: false }];
  const lower = original.toLowerCase();
  const out: MatchPart[] = [];
  let i = 0;
  const qlen = q.length;
  while (i < original.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      out.push({ text: original.slice(i), highlight: false });
      break;
    }
    if (idx > i) out.push({ text: original.slice(i, idx), highlight: false });
    out.push({ text: original.slice(idx, idx + qlen), highlight: true });
    i = idx + qlen;
  }
  return out;
}

function firstPlainLyricLine(song: Song): string | null {
  for (const block of song.lyrics || []) {
    for (const line of block.lines || []) {
      if (line && String(line).trim()) return String(line);
    }
  }
  return null;
}

function firstCreditLine(song: Song): string | null {
  for (const c of song.credit || []) {
    const t = (c || '').trim();
    if (t) return t;
  }
  return null;
}

function creditHasMatch(song: Song, q: string): boolean {
  return normalize(songCreditText(song)).includes(q);
}

function titleHasMatch(song: Song, q: string): boolean {
  return normalize(songTitleText(song)).includes(q);
}

function lyricHasMatch(song: Song, q: string): boolean {
  return normalize(songLyricsText(song)).includes(q);
}

function findCreditSnippet(song: Song, q: string): MatchPart[] | null {
  for (const c of song.credit || []) {
    const str = c == null ? '' : String(c);
    const low = str.toLowerCase();
    const idx = low.indexOf(q);
    if (idx === -1) continue;
    const padBefore = 20;
    const padAfter = 40;
    const start = Math.max(0, idx - padBefore);
    const end = Math.min(str.length, idx + q.length + padAfter);
    const slice = str.slice(start, end);
    return splitMatchParts(slice, q);
  }
  return null;
}

function findLyricSnippet(
  song: Song,
  q: string
): { parts: MatchPart[]; ellipsLeft: boolean; ellipsRight: boolean } | null {
  for (const block of song.lyrics || []) {
    const label = block.label ? String(block.label) : '';
    if (label && label.toLowerCase().includes(q)) {
      return {
        parts: splitMatchParts(label, q),
        ellipsLeft: false,
        ellipsRight: false,
      };
    }
    for (const line of block.lines || []) {
      const str = line == null ? '' : String(line);
      const low = str.toLowerCase();
      const idx = low.indexOf(q);
      if (idx === -1) continue;
      const padBefore = 28;
      const padAfter = 52;
      const start = Math.max(0, idx - padBefore);
      const end = Math.min(str.length, idx + q.length + padAfter);
      const slice = str.slice(start, end);
      return {
        parts: splitMatchParts(slice, q),
        ellipsLeft: start > 0,
        ellipsRight: end < str.length,
      };
    }
  }
  return null;
}

export type SearchSnippetMatchKind = 'title' | 'credit' | 'lyric' | 'none';

export interface SearchSnippet {
  titleParts: MatchPart[];
  secondaryParts: MatchPart[] | null;
  secondaryEllipsLeft: boolean;
  secondaryEllipsRight: boolean;
  matchKind: SearchSnippetMatchKind;
}

export function getSearchSnippet(
  song: Song,
  queryRaw: string,
  displayTitle?: string
): SearchSnippet {
  const q = normalize(queryRaw);
  const rowTitle = displayTitle ?? getPrimaryTitle(song);
  const titleParts = q
    ? splitMatchParts(rowTitle, q)
    : [{ text: rowTitle, highlight: false }];

  if (!q) {
    const line = firstPlainLyricLine(song);
    return {
      titleParts,
      secondaryParts: line
        ? [
            {
              text: line.length > 110 ? `${line.slice(0, 107)}…` : line,
              highlight: false,
            },
          ]
        : null,
      secondaryEllipsLeft: false,
      secondaryEllipsRight: false,
      matchKind: 'none',
    };
  }

  const inTitle = displayTitle
    ? normalize(displayTitle).includes(q)
    : titleHasMatch(song, q);
  const inCredit = creditHasMatch(song, q);
  const inLyric = lyricHasMatch(song, q);

  if (inCredit && !inTitle) {
    const creditParts = findCreditSnippet(song, q);
    if (creditParts) {
      return {
        titleParts,
        secondaryParts: creditParts,
        secondaryEllipsLeft: false,
        secondaryEllipsRight: false,
        matchKind: 'credit',
      };
    }
    const line = firstCreditLine(song);
    return {
      titleParts,
      secondaryParts: line ? [{ text: line, highlight: false }] : null,
      secondaryEllipsLeft: false,
      secondaryEllipsRight: false,
      matchKind: 'credit',
    };
  }

  if (inLyric) {
    const found = findLyricSnippet(song, q);
    if (found) {
      return {
        titleParts,
        secondaryParts: found.parts,
        secondaryEllipsLeft: found.ellipsLeft,
        secondaryEllipsRight: found.ellipsRight,
        matchKind: 'lyric',
      };
    }
  }

  const line = firstPlainLyricLine(song);
  return {
    titleParts,
    secondaryParts: line
      ? [
          {
            text: line.length > 110 ? `${line.slice(0, 107)}…` : line,
            highlight: false,
          },
        ]
      : null,
    secondaryEllipsLeft: false,
    secondaryEllipsRight: false,
    matchKind: inTitle ? 'title' : 'none',
  };
}
