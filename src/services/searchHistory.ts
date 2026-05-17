import { KEYS, getItem, setItem } from './storage';

const MAX_ENTRIES = 10;

function parseHistory(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [];
  }
}

export async function loadSearchHistory(): Promise<string[]> {
  const raw = await getItem(KEYS.SEARCH_HISTORY);
  return parseHistory(raw);
}

export async function addSearchHistory(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = await loadSearchHistory();
  const filtered = existing.filter(
    (e) => e.toLowerCase() !== trimmed.toLowerCase()
  );
  const next = [trimmed, ...filtered].slice(0, MAX_ENTRIES);
  await setItem(KEYS.SEARCH_HISTORY, JSON.stringify(next));
}

export async function clearSearchHistory(): Promise<void> {
  await setItem(KEYS.SEARCH_HISTORY, JSON.stringify([]));
}
