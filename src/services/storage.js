import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SONGS_DATA: 'songs_data',
  SONGS_VERSION: 'songs_version',
  SETLISTS: 'setlists_data',
  LYRIC_FONT_SCALE: 'lyric_font_scale',
};

export async function getItem(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export { KEYS };
