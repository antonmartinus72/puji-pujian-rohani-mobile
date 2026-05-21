import type { Song } from '../types/songs';
import type { SongSearchIndex, SongSearchIndexMap, SearchCategories } from './search';
import { ensureAtLeastOneCategory } from './search';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Schema version — bump when the persisted shape changes. */
export const SEARCH_INDEX_VERSION = 1;

/** Queries shorter than this bypass the inverted/trigram index entirely. */
export const MIN_QUERY_LENGTH = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IndexPosting {
  songId: number;
  field: 'title' | 'lyrics' | 'credit';
}

export interface PersistedSearchIndex {
  /** Schema version for forward-compatible migrations. */
  version: number;
  /** ISO timestamp of when the index was built. */
  buildTimestamp: string;

  /** Inverted word index: lowercased word → posting list. */
  wordIndex: Record<string, IndexPosting[]>;

  /** Trigram index: 3-char substring → unique song IDs. */
  trigramIndex: Record<string, number[]>;

  /** Pre-computed lowercase text per song (for snippet extraction). */
  songTexts: Record<number, SongSearchIndex>;

  /** Tag index: lowercased tag → song IDs. */
  tagIndex: Record<string, number[]>;

  /** ID-prefix index: every numeric prefix of song.id → song IDs. */
  idPrefixIndex: Record<string, number[]>;
}

export interface ScoredSongId {
  songId: number;
  score: number;
  /** Which field produced the best hit. */
  bestField: 'title' | 'credit' | 'lyrics' | 'none';
}

// ---------------------------------------------------------------------------
// Tokeniser helpers
// ---------------------------------------------------------------------------

/**
 * Tokenise Indonesian/general text into searchable word tokens.
 *
 * Rules:
 *  - Lowercase the whole string.
 *  - Keep alphanumeric, hyphens inside words, apostrophes inside words.
 *  - Split on whitespace & remaining punctuation.
 *  - Discard tokens shorter than 1 character.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Replace non-alphanumeric except apostrophe/hyphen with space, then split
  const cleaned = lower.replace(/[^a-z0-9\u00C0-\u024F'-]/g, ' ');
  const tokens: string[] = [];
  for (const raw of cleaned.split(/\s+/)) {
    // Trim leading/trailing hyphens and apostrophes
    const t = raw.replace(/^['-]+|['-]+$/g, '');
    if (t.length > 0) tokens.push(t);
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Trigram helpers
// ---------------------------------------------------------------------------

/**
 * Generate all trigrams (3-char substrings) from a word.
 * If the word is shorter than 3 chars, returns the word itself as a "short-gram".
 */
export function generateTrigrams(word: string): string[] {
  if (word.length < 3) return [word];
  const trigrams: string[] = [];
  for (let i = 0; i <= word.length - 3; i++) {
    trigrams.push(word.slice(i, i + 3));
  }
  return trigrams;
}

// ---------------------------------------------------------------------------
// Text extractors (mirrors logic in search.ts but returns per-field text)
// ---------------------------------------------------------------------------

function songTitleText(song: Song): string {
  return (song.title || [])
    .map((t) => (t || '').trim())
    .filter(Boolean)
    .join(' ');
}

function songCreditText(song: Song): string {
  return (song.credit || [])
    .map((c) => (c || '').trim())
    .filter(Boolean)
    .join(' ');
}

function songLyricsText(song: Song): string {
  if (!song.lyrics || !Array.isArray(song.lyrics)) return '';
  return song.lyrics
    .map((block) => [block.label, ...(block.lines || [])].join(' '))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Index builder
// ---------------------------------------------------------------------------

export function buildPersistedIndex(songs: Song[]): PersistedSearchIndex {
  const wordIndex: Record<string, IndexPosting[]> = {};
  const trigramSet: Record<string, Set<number>> = {};
  const songTexts: Record<number, SongSearchIndex> = {};
  const tagIdx: Record<string, Set<number>> = {};
  const idPrefixIdx: Record<string, Set<number>> = {};

  function addWord(word: string, songId: number, field: 'title' | 'lyrics' | 'credit') {
    if (!wordIndex[word]) wordIndex[word] = [];
    wordIndex[word].push({ songId, field });
  }

  function addTrigrams(word: string, songId: number) {
    for (const tri of generateTrigrams(word)) {
      if (!trigramSet[tri]) trigramSet[tri] = new Set();
      trigramSet[tri].add(songId);
    }
  }

  for (const song of songs) {
    const id = song.id;

    // --- Song texts (for snippet extraction & substring fallback) ----------
    const titleText = songTitleText(song);
    const creditText = songCreditText(song);
    const lyricsText = songLyricsText(song);

    songTexts[id] = {
      titleTextLower: titleText.toLowerCase(),
      lyricsTextLower: lyricsText.toLowerCase(),
      creditTextLower: creditText.toLowerCase(),
    };

    // --- Word + trigram index -----------------------------------------------
    const titleTokens = tokenize(titleText);
    const creditTokens = tokenize(creditText);
    const lyricsTokens = tokenize(lyricsText);

    for (const w of titleTokens) {
      addWord(w, id, 'title');
      addTrigrams(w, id);
    }
    for (const w of creditTokens) {
      addWord(w, id, 'credit');
      addTrigrams(w, id);
    }
    for (const w of lyricsTokens) {
      addWord(w, id, 'lyrics');
      addTrigrams(w, id);
    }

    // --- Tag index ----------------------------------------------------------
    for (const tag of song.tags ?? []) {
      const t = tag.trim().toLowerCase();
      if (!t) continue;
      if (!tagIdx[t]) tagIdx[t] = new Set();
      tagIdx[t].add(id);
    }

    // --- ID prefix index ----------------------------------------------------
    const idStr = String(id);
    for (let len = 1; len <= idStr.length; len++) {
      const prefix = idStr.slice(0, len);
      if (!idPrefixIdx[prefix]) idPrefixIdx[prefix] = new Set();
      idPrefixIdx[prefix].add(id);
    }
  }

  // Convert Sets to arrays for JSON serialisation
  const trigramIndex: Record<string, number[]> = {};
  for (const [tri, set] of Object.entries(trigramSet)) {
    trigramIndex[tri] = [...set];
  }

  const tagIndex: Record<string, number[]> = {};
  for (const [tag, set] of Object.entries(tagIdx)) {
    tagIndex[tag] = [...set];
  }

  const idPrefixIndex: Record<string, number[]> = {};
  for (const [prefix, set] of Object.entries(idPrefixIdx)) {
    idPrefixIndex[prefix] = [...set];
  }

  return {
    version: SEARCH_INDEX_VERSION,
    buildTimestamp: new Date().toISOString(),
    wordIndex,
    trigramIndex,
    songTexts,
    tagIndex,
    idPrefixIndex,
  };
}

// ---------------------------------------------------------------------------
// Query engine
// ---------------------------------------------------------------------------

/** Relevance weights by field and match type. */
const SCORE_TITLE_WORD = 100;
const SCORE_TITLE_SUBSTRING = 70;
const SCORE_CREDIT_WORD = 50;
const SCORE_CREDIT_SUBSTRING = 30;
const SCORE_LYRICS_WORD = 20;
const SCORE_LYRICS_SUBSTRING = 10;

/**
 * 2-phase search:
 *
 * Phase 1 — **Word match**: tokenise the query, look up each token in the
 *           inverted `wordIndex`.  Very fast O(1) per token.
 *
 * Phase 2 — **Trigram / substring fallback**: for the query tokens that did
 *           *not* yield results in Phase 1, look up their trigrams in
 *           `trigramIndex` to find candidate songs, then verify with a
 *           substring check against `songTexts`.
 *
 * Results are de-duplicated and scored.
 */
export function queryIndex(
  index: PersistedSearchIndex,
  query: string,
  categories: SearchCategories,
): ScoredSongId[] {
  const q = query.toLowerCase().trim();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const cats = ensureAtLeastOneCategory(categories);
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];

  // Accumulator: songId → { score, bestField }
  const acc = new Map<number, { score: number; bestField: 'title' | 'credit' | 'lyrics' | 'none' }>();

  function addHit(songId: number, score: number, field: 'title' | 'credit' | 'lyrics') {
    const existing = acc.get(songId);
    if (existing) {
      existing.score += score;
      if (score > fieldScore(existing.bestField)) {
        existing.bestField = field;
      }
    } else {
      acc.set(songId, { score, bestField: field });
    }
  }

  // --- Phase 1: Word match -------------------------------------------------
  for (const token of tokens) {
    const postings = index.wordIndex[token];
    if (!postings) continue;
    for (const p of postings) {
      if (p.field === 'title' && cats.judul) addHit(p.songId, SCORE_TITLE_WORD, 'title');
      else if (p.field === 'credit' && cats.sumberKarya) addHit(p.songId, SCORE_CREDIT_WORD, 'credit');
      else if (p.field === 'lyrics' && cats.lirik) addHit(p.songId, SCORE_LYRICS_WORD, 'lyrics');
    }
  }

  // --- Phase 2: Trigram / substring fallback --------------------------------
  // Build the full query string for substring verification
  const fullQueryLower = q;

  // Collect trigrams from the full query (not per-token) for substring matching
  const queryTrigrams = generateTrigrams(fullQueryLower);
  if (queryTrigrams.length > 0) {
    // Find candidate songs: intersection of all trigram posting lists
    let candidates: Set<number> | null = null;
    for (const tri of queryTrigrams) {
      const ids = index.trigramIndex[tri];
      if (!ids) {
        candidates = new Set();
        break;
      }
      if (candidates === null) {
        candidates = new Set(ids);
      } else {
        const next = new Set<number>();
        for (const id of ids) {
          if (candidates.has(id)) next.add(id);
        }
        candidates = next;
      }
    }

    // Verify candidates with substring check & score
    if (candidates && candidates.size > 0) {
      for (const songId of candidates) {
        const texts = index.songTexts[songId];
        if (!texts) continue;

        if (cats.judul && texts.titleTextLower.includes(fullQueryLower)) {
          addHit(songId, SCORE_TITLE_SUBSTRING, 'title');
        }
        if (cats.sumberKarya && texts.creditTextLower.includes(fullQueryLower)) {
          addHit(songId, SCORE_CREDIT_SUBSTRING, 'credit');
        }
        if (cats.lirik && texts.lyricsTextLower.includes(fullQueryLower)) {
          addHit(songId, SCORE_LYRICS_SUBSTRING, 'lyrics');
        }
      }
    }
  }

  // --- Build ranked results -----------------------------------------------
  const results: ScoredSongId[] = [];
  for (const [songId, data] of acc) {
    results.push({ songId, score: data.score, bestField: data.bestField });
  }

  return rankResults(results);
}

function fieldScore(field: string): number {
  switch (field) {
    case 'title': return SCORE_TITLE_WORD;
    case 'credit': return SCORE_CREDIT_WORD;
    case 'lyrics': return SCORE_LYRICS_WORD;
    default: return 0;
  }
}

/**
 * Sort scored results by descending relevance score.
 */
export function rankResults(results: ScoredSongId[]): ScoredSongId[] {
  return results.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Tag & ID-prefix indexed lookups
// ---------------------------------------------------------------------------

/**
 * Filter songs by tags using the pre-built tag index.
 * Falls back to linear scan for tags not in the index.
 */
export function filterSongsByTagsIndexed(
  songs: Song[],
  selectedTags: string[],
  tagIndex: Record<string, number[]>,
): Song[] {
  if (selectedTags.length === 0) return songs;

  // Intersect song IDs across all selected tags
  let candidateIds: Set<number> | null = null;
  for (const tag of selectedTags) {
    const lower = tag.toLowerCase();
    const ids = tagIndex[lower];
    if (!ids || ids.length === 0) return []; // tag not found → no results
    const idSet = new Set(ids);
    if (candidateIds === null) {
      candidateIds = idSet;
    } else {
      const next = new Set<number>();
      for (const id of idSet) {
        if (candidateIds.has(id)) next.add(id);
      }
      candidateIds = next;
    }
  }

  if (!candidateIds || candidateIds.size === 0) return [];
  return songs.filter((s) => candidateIds!.has(s.id));
}

/**
 * Filter songs by numeric ID prefix using the pre-built prefix index.
 */
export function filterByIdPrefixIndexed(
  songs: Song[],
  numPrefix: string,
  idPrefixIndex: Record<string, number[]>,
): Song[] {
  const ids = idPrefixIndex[numPrefix];
  if (!ids || ids.length === 0) return [];
  const idSet = new Set(ids);
  return songs.filter((s) => idSet.has(s.id));
}

// ---------------------------------------------------------------------------
// Backward compatibility
// ---------------------------------------------------------------------------

/**
 * Derive the old-style `SongSearchIndexMap` from a `PersistedSearchIndex`.
 * This lets existing code paths that expect `SongSearchIndexMap` keep working.
 */
export function deriveSearchIndexMap(index: PersistedSearchIndex): SongSearchIndexMap {
  const map = new Map<number, SongSearchIndex>();
  for (const [idStr, texts] of Object.entries(index.songTexts)) {
    map.set(Number(idStr), texts);
  }
  return map;
}
