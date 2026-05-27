import type { ScaleType, SongsPayload } from '../types/songs';

const ROOT_NOTE_RE = /^[a-g](-sharp|-flat)?$/;

export type ValidateSongsPayloadResult =
  | { ok: true; data: SongsPayload }
  | { ok: false; errors: string[] };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function validateStringArray(
  value: unknown,
  path: string,
  required: boolean
): string[] | null {
  if (value === undefined || value === null) {
    if (required) return null;
    return [];
  }
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'string') return null;
    out.push(value[i]);
  }
  return out;
}

function validateLyrics(
  value: unknown,
  path: string,
  errors: string[]
): boolean {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }
  let ok = true;
  value.forEach((block, i) => {
    const bp = `${path}[${i}]`;
    if (!isPlainObject(block)) {
      errors.push(`${bp} must be an object`);
      ok = false;
      return;
    }
    if (block.label !== undefined && typeof block.label !== 'string') {
      errors.push(`${bp}.label must be a string`);
      ok = false;
    }
    if (block.lines !== undefined) {
      const lines = validateStringArray(block.lines, `${bp}.lines`, false);
      if (lines === null) {
        errors.push(`${bp}.lines must be an array of strings`);
        ok = false;
      }
    }
  });
  return ok;
}

function validateSong(raw: unknown, index: number, errors: string[]): boolean {
  const path = `songs[${index}]`;
  if (!isPlainObject(raw)) {
    errors.push(`${path} must be an object`);
    return false;
  }

  let ok = true;

  if (raw.id === undefined || raw.id === null) {
    errors.push(`${path}.id is required`);
    ok = false;
  } else if (typeof raw.id !== 'number' || !Number.isFinite(raw.id)) {
    errors.push(`${path}.id must be a finite number`);
    ok = false;
  }

  if (!Array.isArray(raw.title)) {
    errors.push(
      `${path}.title must be an array of strings (legacy string titles are not allowed)`
    );
    ok = false;
  } else if (raw.title.length === 0) {
    errors.push(`${path}.title must contain at least one string`);
    ok = false;
  } else {
    for (let i = 0; i < raw.title.length; i++) {
      if (typeof raw.title[i] !== 'string') {
        errors.push(`${path}.title[${i}] must be a string`);
        ok = false;
      }
    }
  }

  if (!Array.isArray(raw.credit)) {
    errors.push(`${path}.credit must be an array of strings`);
    ok = false;
  } else {
    for (let i = 0; i < raw.credit.length; i++) {
      if (typeof raw.credit[i] !== 'string') {
        errors.push(`${path}.credit[${i}] must be a string`);
        ok = false;
      }
    }
  }

  if (raw.tags !== undefined) {
    const tags = validateStringArray(raw.tags, `${path}.tags`, false);
    if (tags === null) {
      errors.push(`${path}.tags must be an array of strings`);
      ok = false;
    }
  }

  if (raw.rootNote !== undefined && raw.rootNote !== '') {
    if (typeof raw.rootNote !== 'string') {
      errors.push(`${path}.rootNote must be a string`);
      ok = false;
    } else {
      const v = raw.rootNote.trim().toLowerCase();
      if (!ROOT_NOTE_RE.test(v)) {
        errors.push(
          `${path}.rootNote must match pattern c, c-sharp, or c-flat (a–g)`
        );
        ok = false;
      }
    }
  }

  if (raw.scaleType !== undefined && raw.scaleType !== '') {
    if (raw.scaleType !== 'major' && raw.scaleType !== 'minor') {
      errors.push(`${path}.scaleType must be "major" or "minor"`);
      ok = false;
    }
  }

  const hasRootNote = raw.rootNote !== undefined && raw.rootNote !== '';
  const hasScaleType = raw.scaleType !== undefined && raw.scaleType !== '';

  if (hasScaleType && !hasRootNote) {
    errors.push(`${path}.rootNote is required when scaleType is set`);
    ok = false;
  }

  if (hasRootNote && !hasScaleType) {
    errors.push(`${path}.scaleType is required when rootNote is set`);
    ok = false;
  }

  if (!validateLyrics(raw.lyrics, `${path}.lyrics`, errors)) {
    ok = false;
  }

  return ok;
}

export function validateSongsPayload(parsed: unknown): ValidateSongsPayloadResult {
  const errors: string[] = [];

  if (!isPlainObject(parsed)) {
    return { ok: false, errors: ['Root payload must be a JSON object'] };
  }

  if (typeof parsed.version !== 'string' || !parsed.version.trim()) {
    errors.push('version must be a non-empty string');
  }

  if (!Array.isArray(parsed.songs)) {
    errors.push('songs must be an array');
    return { ok: false, errors };
  }

  let allSongsOk = true;
  parsed.songs.forEach((song, i) => {
    if (!validateSong(song, i, errors)) allSongsOk = false;
  });

  if (!allSongsOk || errors.length > 0) {
    return { ok: false, errors };
  }

  const data: SongsPayload = {
    version: parsed.version as string,
    updatedAt:
      typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
    totalSongs:
      typeof parsed.totalSongs === 'number' ? parsed.totalSongs : parsed.songs.length,
    songs: parsed.songs as SongsPayload['songs'],
  };

  return { ok: true, data };
}

export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return 'Format songs.json tidak valid.';
  if (errors.length === 1) return errors[0];
  return errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n…+${errors.length - 5} lainnya` : '');
}
