import {
  BRANCH,
  DEFAULT_DB_NAME,
  GITHUB_REPO,
  GITHUB_USERNAME,
} from '../constants/config';
import type { GithubRepoConfig } from '../utils/githubUrls';
import {
  KEYS,
  dbSetlistsKey,
  dbSongsKey,
  dbVersionKey,
  getDynamicItem,
  getItem,
  removeDynamicItem,
  removeItem,
  setDynamicItem,
  setItem,
} from './storage';

export type DatabaseId = 'default' | string;

export type DatabaseKind = 'default' | 'custom';

export interface DatabaseProfile {
  id: DatabaseId;
  name: string;
  kind: DatabaseKind;
  github: GithubRepoConfig;
}

export interface DatabaseRegistryState {
  activeId: DatabaseId;
  profiles: DatabaseProfile[];
}

function newCustomId(): string {
  return `db_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultGithubConfig(): GithubRepoConfig {
  return {
    username: GITHUB_USERNAME,
    repo: GITHUB_REPO,
    branch: BRANCH,
  };
}

export function createDefaultProfile(): DatabaseProfile {
  return {
    id: 'default',
    name: DEFAULT_DB_NAME,
    kind: 'default',
    github: createDefaultGithubConfig(),
  };
}

function isRegistryState(parsed: unknown): parsed is DatabaseRegistryState {
  if (!parsed || typeof parsed !== 'object') return false;
  const p = parsed as DatabaseRegistryState;
  if (!Array.isArray(p.profiles) || typeof p.activeId !== 'string') return false;
  return p.profiles.every(
    (profile) =>
      profile &&
      typeof profile.id === 'string' &&
      typeof profile.name === 'string' &&
      (profile.kind === 'default' || profile.kind === 'custom') &&
      profile.github &&
      typeof profile.github.username === 'string' &&
      typeof profile.github.repo === 'string' &&
      typeof profile.github.branch === 'string'
  );
}

async function migrateLegacyKeys(): Promise<void> {
  const [legacySongs, legacyVersion, legacySetlists] = await Promise.all([
    getItem(KEYS.SONGS_DATA),
    getItem(KEYS.SONGS_VERSION),
    getItem(KEYS.SETLISTS),
  ]);

  if (legacySongs) {
    await setDynamicItem(dbSongsKey('default'), legacySongs);
    await removeItem(KEYS.SONGS_DATA);
  }
  if (legacyVersion) {
    await setDynamicItem(dbVersionKey('default'), legacyVersion);
    await removeItem(KEYS.SONGS_VERSION);
  }
  if (legacySetlists) {
    await setDynamicItem(dbSetlistsKey('default'), legacySetlists);
    await removeItem(KEYS.SETLISTS);
  }
}

export async function loadRegistry(): Promise<DatabaseRegistryState> {
  const raw = await getItem(KEYS.DB_REGISTRY);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isRegistryState(parsed)) {
        const hasDefault = parsed.profiles.some((p) => p.id === 'default');
        if (!hasDefault) {
          parsed.profiles = [createDefaultProfile(), ...parsed.profiles];
        }
        if (!parsed.profiles.some((p) => p.id === parsed.activeId)) {
          parsed.activeId = 'default';
        }
        return parsed;
      }
    } catch {
      /* fallthrough */
    }
  }

  await migrateLegacyKeys();
  const state: DatabaseRegistryState = {
    activeId: 'default',
    profiles: [createDefaultProfile()],
  };
  await saveRegistry(state);
  return state;
}

export async function saveRegistry(state: DatabaseRegistryState): Promise<void> {
  await setItem(KEYS.DB_REGISTRY, JSON.stringify(state));
}

export function getProfile(
  state: DatabaseRegistryState,
  id: DatabaseId
): DatabaseProfile | null {
  return state.profiles.find((p) => p.id === id) ?? null;
}

export async function setActiveProfileId(id: DatabaseId): Promise<DatabaseRegistryState> {
  const state = await loadRegistry();
  if (!getProfile(state, id)) return state;
  state.activeId = id;
  await saveRegistry(state);
  return state;
}

export async function updateProfileGithub(
  id: DatabaseId,
  github: GithubRepoConfig
): Promise<DatabaseRegistryState> {
  const state = await loadRegistry();
  const profile = getProfile(state, id);
  if (!profile) return state;
  profile.github = github;
  await saveRegistry(state);
  return state;
}

export async function updateDefaultGithub(
  github: GithubRepoConfig
): Promise<DatabaseRegistryState> {
  return updateProfileGithub('default', github);
}

export async function addCustomProfile(
  name: string,
  github: GithubRepoConfig
): Promise<{ state: DatabaseRegistryState; profile: DatabaseProfile }> {
  const state = await loadRegistry();
  const profile: DatabaseProfile = {
    id: newCustomId(),
    name: name.trim(),
    kind: 'custom',
    github: {
      username: github.username.trim(),
      repo: github.repo.trim(),
      branch: github.branch.trim() || 'main',
    },
  };
  state.profiles.push(profile);
  await saveRegistry(state);
  return { state, profile };
}

export async function removeCustomProfile(id: DatabaseId): Promise<DatabaseRegistryState> {
  const state = await loadRegistry();
  if (id === 'default') return state;
  state.profiles = state.profiles.filter((p) => p.id !== id);
  if (state.activeId === id) state.activeId = 'default';
  await saveRegistry(state);
  await Promise.all([
    removeDynamicItem(dbSongsKey(id)),
    removeDynamicItem(dbVersionKey(id)),
    removeDynamicItem(dbSetlistsKey(id)),
  ]);
  return state;
}

export async function renameProfile(
  id: DatabaseId,
  name: string
): Promise<DatabaseRegistryState> {
  const state = await loadRegistry();
  const profile = getProfile(state, id);
  if (!profile) return state;
  profile.name = name.trim();
  await saveRegistry(state);
  return state;
}

export async function clearProfileCache(id: DatabaseId): Promise<void> {
  await Promise.all([
    removeDynamicItem(dbSongsKey(id)),
    removeDynamicItem(dbVersionKey(id)),
  ]);
}
