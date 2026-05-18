import type { ScaleType, Song } from '../types/songs';

export function formatTitleSlot(s: string): string {
  const t = (s || '').trim();
  return t ? t : '—';
}

export function getPrimaryTitle(song: Song): string {
  for (const t of song.title || []) {
    const trimmed = (t || '').trim();
    if (trimmed) return trimmed;
  }
  return '—';
}

export function getAlternateTitleCount(song: Song): number {
  const titles = song.title || [];
  let seenPrimary = false;
  let count = 0;
  for (const t of titles) {
    const trimmed = (t || '').trim();
    if (!trimmed) continue;
    if (!seenPrimary) {
      seenPrimary = true;
      continue;
    }
    count += 1;
  }
  return count;
}

export function formatListTitle(song: Song): string {
  const primary = getPrimaryTitle(song);
  const alt = getAlternateTitleCount(song);
  if (alt <= 0) return primary;
  return `${primary} (+${alt} judul lain)`;
}

export function formatReaderTitles(song: Song): string[] {
  const slots = song.title?.length ? song.title : [''];
  return slots.map(formatTitleSlot);
}

export function formatCreditLines(song: Song): string[] {
  const credits = song.credit || [];
  if (credits.length === 0) return [];
  return credits
    .map((c) => (c || '').trim())
    .filter((c) => c.length > 0)
    .map((c) => c);
}

export function formatKeySignature(
  rootNote?: string,
  scaleType?: ScaleType
): string | null {
  if (!rootNote || !scaleType) return null;
  const parts = rootNote.toLowerCase().split('-');
  const letter = parts[0];
  if (!letter || letter.length !== 1) return null;

  let note = letter.toUpperCase();
  if (parts[1] === 'sharp') note += '♯';
  else if (parts[1] === 'flat') note += '♭';

  if (scaleType === 'minor') note += 'm';
  return note;
}

export function getSongKeyLabel(song: Song): string | null {
  return formatKeySignature(song.rootNote, song.scaleType);
}

export function countNonEmptyTitles(song: Song): number {
  return (song.title || []).filter((t) => (t || '').trim().length > 0).length;
}

/** Muted list hint when other alternate titles exist, e.g. "+2 judul". */
export function formatOtherTitlesHint(
  song: Song,
  _currentTitleIndex: number
): string | null {
  const total = countNonEmptyTitles(song);
  if (total <= 1) return null;
  return `+${total - 1} judul`;
}

/** Preferred array index, or first non-empty slot, or 0. */
export function resolveDisplayTitleIndex(song: Song, preferredIndex: number): number {
  const titles = song.title || [];
  if (
    preferredIndex >= 0 &&
    preferredIndex < titles.length &&
    (titles[preferredIndex] || '').trim()
  ) {
    return preferredIndex;
  }
  for (let i = 0; i < titles.length; i++) {
    if ((titles[i] || '').trim()) return i;
  }
  return 0;
}

export function getDisplayTitleAtIndex(song: Song, index: number): string {
  const titles = song.title || [];
  const trimmed = (titles[index] || '').trim();
  if (trimmed) return trimmed;
  return getPrimaryTitle(song);
}

export function getAlternateTitleEntries(
  song: Song,
  activeIndex: number
): { text: string; index: number }[] {
  const out: { text: string; index: number }[] = [];
  (song.title || []).forEach((t, index) => {
    const trimmed = (t || '').trim();
    if (trimmed && index !== activeIndex) {
      out.push({ text: trimmed, index });
    }
  });
  return out;
}
