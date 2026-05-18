import type { DatabaseProfile } from './databaseRegistry';
import { buildGithubUrls } from '../utils/githubUrls';
import {
  formatValidationErrors,
  validateSongsPayload,
} from '../utils/validateSongsPayload';
import {
  dbSongsKey,
  dbVersionKey,
  getDynamicItem,
  setDynamicItem,
} from './storage';
import type { SongsPayload } from '../types/songs';

export interface RemoteVersionPayload {
  version: string;
  changelog?: string;
}

export type UpdateCheckResult =
  | { hasUpdate: true; remoteVersion: RemoteVersionPayload }
  | { hasUpdate: false; remoteVersion?: undefined };

export async function getLocalVersion(
  profileId: string
): Promise<RemoteVersionPayload | null> {
  const localVersionStr = await getDynamicItem(dbVersionKey(profileId));
  if (!localVersionStr) return null;
  try {
    return JSON.parse(localVersionStr) as RemoteVersionPayload;
  } catch {
    return null;
  }
}

export async function checkForUpdate(
  profile: DatabaseProfile
): Promise<UpdateCheckResult> {
  try {
    const { versionUrl } = buildGithubUrls(profile.github);
    const response = await fetch(versionUrl, { method: 'GET' });
    if (!response.ok) return { hasUpdate: false };
    const remoteVersion = (await response.json()) as RemoteVersionPayload;

    const localVersion = await getLocalVersion(profile.id);

    if (!localVersion || remoteVersion.version !== localVersion.version) {
      return { hasUpdate: true, remoteVersion };
    }
    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}

export async function downloadUpdate(
  profile: DatabaseProfile,
  remoteVersion: RemoteVersionPayload
): Promise<SongsPayload> {
  const { songsUrl } = buildGithubUrls(profile.github);
  const response = await fetch(songsUrl);
  if (!response.ok) throw new Error('Gagal mengunduh songs.json');
  const songsData: unknown = await response.json();
  const validation = validateSongsPayload(songsData);
  if (!validation.ok) {
    throw new Error(formatValidationErrors(validation.errors));
  }

  await setDynamicItem(dbSongsKey(profile.id), JSON.stringify(validation.data));
  await setDynamicItem(dbVersionKey(profile.id), JSON.stringify(remoteVersion));

  return validation.data;
}

export async function fetchRemoteVersion(
  profile: DatabaseProfile
): Promise<RemoteVersionPayload> {
  const { versionUrl } = buildGithubUrls(profile.github);
  const response = await fetch(versionUrl, { method: 'GET' });
  if (!response.ok) throw new Error('Gagal mengambil version.json');
  return (await response.json()) as RemoteVersionPayload;
}

export async function probeGithubRepo(
  profile: DatabaseProfile
): Promise<void> {
  try {
    await fetchRemoteVersion(profile);
    return;
  } catch {
    const { songsUrl } = buildGithubUrls(profile.github);
    const response = await fetch(songsUrl, { method: 'GET' });
    if (!response.ok) throw new Error('Repositori tidak dapat diakses');
    const data: unknown = await response.json();
    const validation = validateSongsPayload(data);
    if (!validation.ok) {
      throw new Error(formatValidationErrors(validation.errors));
    }
  }
}
