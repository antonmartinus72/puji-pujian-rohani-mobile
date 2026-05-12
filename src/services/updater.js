import { VERSION_URL, SONGS_URL } from '../constants/config';
import { KEYS, getItem, setItem } from './storage';

export async function checkForUpdate() {
  try {
    const response = await fetch(VERSION_URL, { method: 'GET' });
    if (!response.ok) return { hasUpdate: false };
    const remoteVersion = await response.json();

    const localVersionStr = await getItem(KEYS.SONGS_VERSION);
    const localVersion = localVersionStr ? JSON.parse(localVersionStr) : null;

    if (!localVersion || remoteVersion.version !== localVersion.version) {
      return { hasUpdate: true, remoteVersion };
    }
    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}

export async function downloadUpdate(remoteVersion) {
  const response = await fetch(SONGS_URL);
  if (!response.ok) throw new Error('Gagal mengunduh songs.json');
  const songsData = await response.json();

  await setItem(KEYS.SONGS_DATA, JSON.stringify(songsData));
  await setItem(KEYS.SONGS_VERSION, JSON.stringify(remoteVersion));

  return songsData;
}
