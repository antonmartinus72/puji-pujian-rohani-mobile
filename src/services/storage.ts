import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  SONGS_DATA: 'songs_data',
  SONGS_VERSION: 'songs_version',
  SETLISTS: 'setlists_data',
  LYRIC_FONT_SCALE: 'lyric_font_scale',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

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
