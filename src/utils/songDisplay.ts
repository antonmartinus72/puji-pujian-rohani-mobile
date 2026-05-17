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
