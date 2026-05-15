import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  DB_REGISTRY: 'db_registry',
  SONGS_DATA: 'songs_data',
  SONGS_VERSION: 'songs_version',
  SETLISTS: 'setlists_data',
  LYRIC_FONT_SCALE: 'lyric_font_scale',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

export function dbSongsKey(profileId: string): string {
  return `db_songs_${profileId}`;
}

export function dbVersionKey(profileId: string): string {
  return `db_version_${profileId}`;
}

export function dbSetlistsKey(profileId: string): string {
  return `db_setlists_${profileId}`;
}

export async function getItem(key: StorageKey): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: StorageKey, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function removeItem(key: StorageKey): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export async function getDynamicItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setDynamicItem(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function removeDynamicItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
