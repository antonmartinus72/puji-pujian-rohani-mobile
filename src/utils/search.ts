import type { Song } from '../types/songs';

/**
 * Pencarian sederhana: judul atau gabungan lirik mengandung query (case-insensitive).
 */
function normalize(s: string | undefined | null): string {
  return (s || '').toLowerCase().trim();
}

function songLyricsText(song: Song): string {
  if (!song.lyrics || !Array.isArray(song.lyrics)) return '';
  return song.lyrics
    .map((block) => [block.label, ...(block.lines || [])].join(' '))
    .join(' ');
}

export function searchSongs(songs: Song[], query: string): Song[] {
  const q = normalize(query);
  if (!q) return songs;

  return songs.filter((song) => {
    const title = normalize(song.title);
    const body = normalize(songLyricsText(song));
    return title.includes(q) || body.includes(q);
  });
}

export interface MatchPart {
  text: string;
  highlight: boolean;
}

/**
 * Pecah teks menjadi segmen untuk sorotan (case-insensitive), berurutan tanpa overlap.
 */
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

export interface SearchSnippet {
  titleParts: MatchPart[];
  lyricParts: MatchPart[] | null;
  lyricEllipsLeft: boolean;
  lyricEllipsRight: boolean;
}

/**
 * Judul + cuplikan lirik untuk layar hasil pencarian (sorotan di judul dan/atau lirik).
 */
export function getSearchSnippet(song: Song, queryRaw: string): SearchSnippet {
  const q = normalize(queryRaw);
  const titleParts = q
    ? splitMatchParts(song.title, q)
    : [{ text: song.title, highlight: false }];

  if (!q) {
    const line = firstPlainLyricLine(song);
    return {
      titleParts,
      lyricParts: line
        ? [
            {
              text: line.length > 110 ? `${line.slice(0, 107)}…` : line,
              highlight: false,
            },
          ]
        : null,
      lyricEllipsLeft: false,
      lyricEllipsRight: false,
    };
  }

  const bodyText = songLyricsText(song);
  const bodyHas = bodyText.toLowerCase().includes(q);

  if (!bodyHas) {
    const line = firstPlainLyricLine(song);
    return {
      titleParts,
      lyricParts: line
        ? [
            {
              text: line.length > 110 ? `${line.slice(0, 107)}…` : line,
              highlight: false,
            },
          ]
        : null,
      lyricEllipsLeft: false,
      lyricEllipsRight: false,
    };
  }

  for (const block of song.lyrics || []) {
    const label = block.label ? String(block.label) : '';
    if (label && label.toLowerCase().includes(q)) {
      return {
        titleParts,
        lyricParts: splitMatchParts(label, q),
        lyricEllipsLeft: false,
        lyricEllipsRight: false,
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
        titleParts,
        lyricParts: splitMatchParts(slice, q),
        lyricEllipsLeft: start > 0,
        lyricEllipsRight: end < str.length,
      };
    }
  }

  return {
    titleParts,
    lyricParts: null,
    lyricEllipsLeft: false,
    lyricEllipsRight: false,
  };
}
