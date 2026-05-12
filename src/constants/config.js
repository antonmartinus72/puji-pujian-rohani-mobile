/**
 * Ganti nilai berikut setelah repo data GitHub siap (lihat PPR Mobile Planning.md).
 * Biarkan placeholder jika belum ada repo — aplikasi tetap pakai songs.json lokal.
 */
export const GITHUB_USERNAME = 'antonmartinus72';
export const GITHUB_REPO = 'puji-pujian-rohani-mobile';
export const BRANCH = 'main';

export const VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/version.json`;
export const SONGS_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/songs.json`;

export const APP_NAME = 'PPR Mobile';
