export interface LyricSection {
  label?: string;
  lines?: string[];
}

export interface Song {
  id: number;
  title: string;
  tags?: string[];
  lyrics?: LyricSection[];
}

export interface SongsPayload {
  version: string;
  updatedAt?: string;
  totalSongs?: number;
  songs: Song[];
}
