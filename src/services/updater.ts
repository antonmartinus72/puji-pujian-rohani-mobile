import { SONGS_URL, VERSION_URL } from '../constants/config';
import { KEYS, getItem, setItem } from './storage';
import type { SongsPayload } from '../types/songs';

export interface RemoteVersionPayload {
  version: string;
  changelog?: string;
}

export type UpdateCheckResult =
  | { hasUpdate: true; remoteVersion: RemoteVersionPayload }
  | { hasUpdate: false; remoteVersion?: undefined };

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  try {
    const response = await fetch(VERSION_URL, { method: 'GET' });
    if (!response.ok) return { hasUpdate: false };
    const remoteVersion = (await response.json()) as RemoteVersionPayload;

    const localVersionStr = await getItem(KEYS.SONGS_VERSION);
    const localVersion = localVersionStr
      ? (JSON.parse(localVersionStr) as RemoteVersionPayload)
      : null;

    if (!localVersion || remoteVersion.version !== localVersion.version) {
      return { hasUpdate: true, remoteVersion };
    }
    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}

export async function downloadUpdate(
  remoteVersion: RemoteVersionPayload
): Promise<SongsPayload> {
  const response = await fetch(SONGS_URL);
  if (!response.ok) throw new Error('Gagal mengunduh songs.json');
  const songsData = (await response.json()) as SongsPayload;

  await setItem(KEYS.SONGS_DATA, JSON.stringify(songsData));
  await setItem(KEYS.SONGS_VERSION, JSON.stringify(remoteVersion));

  return songsData;
}
