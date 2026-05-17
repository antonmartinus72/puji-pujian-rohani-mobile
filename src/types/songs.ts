export interface LyricSection {
  label?: string;
  lines?: string[];
}

export type ScaleType = 'major' | 'minor';

export interface Song {
  id: number;
  title: string[];
  credit?: string[];
  tags?: string[];
  rootNote?: string;
  scaleType?: ScaleType;
  lyrics?: LyricSection[];
}

export interface SongsPayload {
  version: string;
  updatedAt?: string;
  totalSongs?: number;
  songs: Song[];
}
