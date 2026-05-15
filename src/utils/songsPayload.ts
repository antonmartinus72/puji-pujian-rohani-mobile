import type { SongsPayload } from '../types/songs';

export function isSongsPayload(parsed: unknown): parsed is SongsPayload {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as { songs?: unknown };
  return Array.isArray(p.songs);
}
