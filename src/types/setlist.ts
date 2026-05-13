export interface WorshipSetlist {
  id: string;
  name: string;
  createdAt: string;
  songs: number[];
}

export interface SetlistSession {
  setlistId: string;
  cursor: number;
}
