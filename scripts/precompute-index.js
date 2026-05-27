const fs = require('fs');
const path = require('path');

const SONGS_FILE = path.join(__dirname, '../assets/songs.json');
const INDEX_OUTPUT = path.join(__dirname, '../assets/searchIndex.json');

const songsData = JSON.parse(fs.readFileSync(SONGS_FILE, 'utf8'));
const songs = songsData.songs;

function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const cleaned = lower.replace(/[^a-z0-9\u00C0-\u024F'-]/g, ' ');
  const tokens = [];
  for (const raw of cleaned.split(/\s+/)) {
    const t = raw.replace(/^['-]+|['-]+$/g, '');
    if (t.length > 0) tokens.push(t);
  }
  return tokens;
}

function generateTrigrams(word) {
  if (word.length < 3) return [word];
  const trigrams = [];
  for (let i = 0; i <= word.length - 3; i++) {
    trigrams.push(word.slice(i, i + 3));
  }
  return trigrams;
}

function songTitleText(song) {
  return (song.title || []).map((t) => (t || '').trim()).filter(Boolean).join(' ');
}
function songCreditText(song) {
  return (song.credit || []).map((c) => (c || '').trim()).filter(Boolean).join(' ');
}
function songLyricsText(song) {
  if (!song.lyrics || !Array.isArray(song.lyrics)) return '';
  return song.lyrics.map((block) => [block.label, ...(block.lines || [])].join(' ')).join(' ');
}

function buildPersistedIndex(songs) {
  const wordIndex = {};
  const trigramSet = {};
  const songTexts = {};
  const tagIdx = {};
  const idPrefixIdx = {};

  function addWord(word, songId, field) {
    if (!wordIndex[word]) wordIndex[word] = [];
    wordIndex[word].push({ songId, field });
  }
  function addTrigrams(word, songId) {
    for (const tri of generateTrigrams(word)) {
      if (!trigramSet[tri]) trigramSet[tri] = new Set();
      trigramSet[tri].add(songId);
    }
  }

  for (const song of songs) {
    const id = song.id;
    const titleText = songTitleText(song);
    const creditText = songCreditText(song);
    const lyricsText = songLyricsText(song);

    songTexts[id] = {
      titleTextLower: titleText.toLowerCase(),
      lyricsTextLower: lyricsText.toLowerCase(),
      creditTextLower: creditText.toLowerCase(),
    };

    const titleTokens = tokenize(titleText);
    const creditTokens = tokenize(creditText);
    const lyricsTokens = tokenize(lyricsText);

    for (const w of titleTokens) { addWord(w, id, 'title'); addTrigrams(w, id); }
    for (const w of creditTokens) { addWord(w, id, 'credit'); addTrigrams(w, id); }
    for (const w of lyricsTokens) { addWord(w, id, 'lyrics'); addTrigrams(w, id); }

    for (const tag of song.tags || []) {
      const t = tag.trim().toLowerCase();
      if (!t) continue;
      if (!tagIdx[t]) tagIdx[t] = new Set();
      tagIdx[t].add(id);
    }

    const idStr = String(id);
    for (let len = 1; len <= idStr.length; len++) {
      const prefix = idStr.slice(0, len);
      if (!idPrefixIdx[prefix]) idPrefixIdx[prefix] = new Set();
      idPrefixIdx[prefix].add(id);
    }
  }

  const trigramIndex = {};
  for (const [tri, set] of Object.entries(trigramSet)) {
    trigramIndex[tri] = [...set];
  }
  const tagIndex = {};
  for (const [tag, set] of Object.entries(tagIdx)) {
    tagIndex[tag] = [...set];
  }
  const idPrefixIndex = {};
  for (const [prefix, set] of Object.entries(idPrefixIdx)) {
    idPrefixIndex[prefix] = [...set];
  }

  return {
    version: 1, // SEARCH_INDEX_VERSION
    buildTimestamp: new Date().toISOString(),
    wordIndex,
    trigramIndex,
    songTexts,
    tagIndex,
    idPrefixIndex,
  };
}

console.log('Building search index...');
const index = buildPersistedIndex(songs);
console.log('Writing to assets/searchIndex.json...');
fs.writeFileSync(INDEX_OUTPUT, JSON.stringify(index), 'utf8');
console.log('Done! Generated searchIndex.json successfully.');
