# Peningkatan Fitur Search: Inverted Index saat Import Database

## Latar Belakang

Aplikasi PPR Mobile saat ini memiliki sistem search yang bekerja dengan cara:
1. Saat songs dimuat, `buildSearchIndex()` di [search.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/utils/search.ts#L56-L66) membuat `SongSearchIndexMap` — sebuah `Map<number, SongSearchIndex>` berisi teks lowercase per lagu (title, lyrics, credit)
2. Index ini di-build **setiap kali** aplikasi dibuka via `useMemo` di [SongContext.tsx:355](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/context/SongContext.tsx#L355)
3. Pencarian menggunakan `String.includes()` — melakukan **linear scan** pada setiap lagu, satu per satu (O(n) per query)

### Masalah dengan Pendekatan Saat Ini
- **Rebuild setiap startup**: Index harus dibangun ulang dari scratch setiap kali app dibuka
- **Linear scan**: Untuk setiap pencarian, semua 600 lagu harus di-scan satu per satu
- **Tidak scalable**: Jika database bertambah ke ribuan lagu, performa akan menurun
- **Tidak ada ranking**: Semua hasil sama bobotnya — match di judul tidak diprioritaskan vs match di baris lirik ke-50

---

## User Review Required

> [!IMPORTANT]
> **Pilihan Strategi Index**: Saya merekomendasikan **Inverted Word Index + Trigram fallback** (lihat detail di bawah). Pendekatan ini mirip dengan full-text index di SQL (seperti `CREATE FULLTEXT INDEX`), tetapi disesuaikan untuk JSON + React Native. Silakan review apakah approach ini sesuai ekspektasi.

> [!IMPORTANT]
> **Storage Overhead**: Index yang di-persist akan menambah ~30-50% ukuran penyimpanan dibanding raw songs JSON saja. Untuk 600 lagu (~500KB songs), estimasi index ~150-250KB. Apakah ini acceptable?

> [!WARNING]
> **Breaking Change pada SearchIndex**: Fungsi `buildSearchIndex()` saat ini akan diganti dengan versi baru. Semua consumer (`SongContext`, `songListEntries`, `SongListScreen`) akan dimodifikasi. Setelah update, user perlu re-download database agar index baru ter-build.

---

## Open Questions

> [!IMPORTANT]
> **Minimum query length**: Haruskah kita tetap mendukung pencarian 1-2 karakter (seperti saat ini), atau set minimum 2-3 karakter untuk performa optimal? Trigram index bekerja paling baik dengan query ≥ 3 karakter.

> [!NOTE]
> **Fallback saat index belum ada**: Saat user baru update app tetapi belum re-download database, index lama belum ada di storage. Rencana saya: gunakan `buildSearchIndex()` lama sebagai fallback sementara, lalu build & persist index baru secara background. Ini memastikan search tetap bekerja tanpa gangguan.

---

## Konsep: Bagaimana Inverted Index Bekerja

Sebagai referensi, berikut cara kerja indexing mirip SQL untuk data JSON:

```
┌─────────────────────────────────────────────────────────┐
│  SONGS JSON (Raw Data)                                  │
│  Song 1: "Bertemu Dalam Kasih-Nya"                      │
│  Song 4: "Satukanlah Hati Kami"                         │
│  Song 9: "Di Hadirat-Mu Aku Puas"                       │
└──────────────────────┬──────────────────────────────────┘
                       │ TOKENIZE & INDEX (saat import)
                       ▼
┌─────────────────────────────────────────────────────────┐
│  INVERTED INDEX (Word → Song IDs)                       │
│                                                         │
│  "bertemu"     → [1]          ← O(1) lookup!            │
│  "dalam"       → [1, 4, 9]                              │
│  "kasih"       → [1, 4]                                 │
│  "hadirat"     → [9]                                    │
│  "hati"        → [4]                                    │
│  ...                                                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  TRIGRAM INDEX (3-char substrings → Song IDs)           │
│  Untuk substring/partial matching                       │
│                                                         │
│  "ber" → [1, 4, ...]                                    │
│  "ert" → [1, ...]                                       │
│  "rte" → [1, ...]                                       │
│  "hat" → [4, 9]                                         │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

**Saat user mengetik "kasih":**
- ❌ Sebelum: Scan 600 lagu × `includes("kasih")` = 600 operasi
- ✅ Sesudah: Lookup `invertedIndex["kasih"]` = langsung dapat `[1, 4]` = 1 operasi

---

## Proposed Changes

### 1. Search Index Builder — Core Engine

#### [NEW] [searchIndexBuilder.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/utils/searchIndexBuilder.ts)

Modul baru yang berisi semua logic untuk membangun dan meng-query inverted index.

**Struktur data baru:**

```typescript
/** Satu entry di inverted index: song ID + field di mana kata ditemukan */
interface IndexPosting {
  songId: number;
  field: 'title' | 'lyrics' | 'credit';
}

/** Index utama yang akan di-persist */
interface PersistedSearchIndex {
  version: number;                              // Schema version untuk migrasi
  buildTimestamp: string;                       // Kapan index dibangun
  
  // Inverted word index: word → posting list
  wordIndex: Record<string, IndexPosting[]>;
  
  // Trigram index untuk substring matching: trigram → song IDs  
  trigramIndex: Record<string, number[]>;
  
  // Pre-computed lowercase text per song (untuk snippet extraction)
  songTexts: Record<number, {
    titleTextLower: string;
    lyricsTextLower: string;
    creditTextLower: string;
  }>;
  
  // Tag index: tag → song IDs (bonus: mempercepat tag filtering)
  tagIndex: Record<string, number[]>;
  
  // ID prefix index: prefix → song IDs (bonus: mempercepat nomor search)
  idPrefixIndex: Record<string, number[]>;
}
```

**Fungsi utama:**

| Fungsi | Deskripsi |
|--------|-----------|
| `buildPersistedIndex(songs)` | Membangun `PersistedSearchIndex` dari array Song. Dipanggil saat import/download. |
| `tokenize(text)` | Memecah teks menjadi kata-kata (handle tanda baca Indonesia, apostrof, dll) |
| `generateTrigrams(word)` | Menghasilkan semua 3-char substring dari sebuah kata |
| `queryIndex(index, query, categories)` | Mencari menggunakan inverted index + trigram fallback |
| `rankResults(matches, query)` | Mengurutkan hasil berdasarkan relevansi |

**Algoritma pencarian 2-phase:**

```
Phase 1: Word Match (cepat, O(1) per kata)
  → Tokenize query → lookup setiap kata di wordIndex
  → Jika semua kata match → return hasil dengan score tinggi

Phase 2: Substring Fallback (untuk partial match)
  → Jika Phase 1 hasilnya sedikit, gunakan trigramIndex
  → Intersection trigram dari query → candidate songs  
  → Verify dengan includes() hanya pada candidates (bukan semua 600 lagu)
```

**Relevance scoring:**

| Match Location | Score |
|---------------|-------|
| Title exact word match | 100 |
| Title substring match | 70 |
| Credit exact word match | 50 |
| Credit substring match | 30 |
| Lyrics exact word match | 20 |
| Lyrics substring match | 10 |

---

### 2. Index Persistence Layer

#### [MODIFY] [storage.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/services/storage.ts)

Menambah key helper untuk menyimpan search index per database profile:

```typescript
// Tambahan baru
export function dbSearchIndexKey(profileId: string): string {
  return `db_search_index_${profileId}`;
}
```

---

### 3. Import Pipeline Integration

#### [MODIFY] [updater.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/services/updater.ts)

Mengubah `downloadUpdate()` agar **sekaligus membangun dan menyimpan index** saat download database:

```diff
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

+  // Build and persist search index during import
+  const normalized = normalizeSongsPayload(validation.data);
+  const searchIndex = buildPersistedIndex(normalized.songs);
+  await setDynamicItem(
+    dbSearchIndexKey(profile.id),
+    JSON.stringify(searchIndex)
+  );

   return validation.data;
 }
```

#### [MODIFY] [databaseRegistry.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/services/databaseRegistry.ts)

Menambahkan cleanup search index saat profile di-remove atau cache di-clear:

```diff
 export async function removeCustomProfile(id: DatabaseId) {
   // ...existing code...
   await Promise.all([
     removeDynamicItem(dbSongsKey(id)),
     removeDynamicItem(dbVersionKey(id)),
     removeDynamicItem(dbSetlistsKey(id)),
+    removeDynamicItem(dbSearchIndexKey(id)),
   ]);
 }

 export async function clearProfileCache(id: DatabaseId) {
   await Promise.all([
     removeDynamicItem(dbSongsKey(id)),
     removeDynamicItem(dbVersionKey(id)),
+    removeDynamicItem(dbSearchIndexKey(id)),
   ]);
 }
```

---

### 4. Context Integration

#### [MODIFY] [SongContext.tsx](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/context/SongContext.tsx)

Mengubah `searchIndex` dari in-memory build menjadi load dari persisted storage, dengan fallback:

```diff
- const searchIndex = useMemo(() => buildSearchIndex(songs), [songs]);
+ const [persistedIndex, setPersistedIndex] = useState<PersistedSearchIndex | null>(null);
+
+ // Load persisted index, or build & save if not available
+ useEffect(() => {
+   if (!songs.length || !activeProfile) return;
+   let cancelled = false;
+   (async () => {
+     const raw = await getDynamicItem(dbSearchIndexKey(activeProfile.id));
+     if (raw && !cancelled) {
+       try {
+         const parsed = JSON.parse(raw) as PersistedSearchIndex;
+         if (parsed.version === SEARCH_INDEX_VERSION) {
+           setPersistedIndex(parsed);
+           return;
+         }
+       } catch { /* rebuild */ }
+     }
+     // Fallback: build index in background
+     const index = buildPersistedIndex(songs);
+     if (!cancelled) {
+       setPersistedIndex(index);
+       await setDynamicItem(dbSearchIndexKey(activeProfile.id), JSON.stringify(index));
+     }
+   })();
+   return () => { cancelled = true; };
+ }, [songs, activeProfile]);
+
+ // Backward compatible: derive old-style index from persisted index
+ const searchIndex = useMemo(() => {
+   if (persistedIndex) return deriveSearchIndexMap(persistedIndex);
+   return buildSearchIndex(songs);  // fallback
+ }, [persistedIndex, songs]);
```

**Perubahan pada `SongContextValue` interface:**

```diff
 export interface SongContextValue {
   songs: Song[];
   searchIndex: SongSearchIndexMap;
+  persistedIndex: PersistedSearchIndex | null;
   // ...rest unchanged
 }
```

---

### 5. Search Logic Upgrade

#### [MODIFY] [songListEntries.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/utils/songListEntries.ts)

Mengupgrade `buildListEntries()` dan `searchSongEntries()` untuk memanfaatkan inverted index ketika tersedia:

```diff
 export function buildListEntries(
   songs: Song[],
   options: {
     textQuery?: string;
     categories?: SearchCategories;
     numberPrefix?: string;
     selectedTags?: string[];
     sortMode?: SortMode;
     indexMap?: SongSearchIndexMap;
+    persistedIndex?: PersistedSearchIndex | null;
   }
 ): SongListEntry[] {
   const numTrim = (options.numberPrefix ?? '').trim();
   const qTrim = (options.textQuery ?? '').trim();

-  let filtered = filterSongsByTags(songs, options.selectedTags ?? []);
+  // Use tag index if available for O(1) tag filtering
+  let filtered = options.persistedIndex
+    ? filterSongsByTagsIndexed(songs, options.selectedTags ?? [], options.persistedIndex.tagIndex)
+    : filterSongsByTags(songs, options.selectedTags ?? []);

-  if (numTrim) {
-    filtered = filtered.filter((s) => String(s.id).startsWith(numTrim));
-  }
+  // Use ID prefix index if available
+  if (numTrim) {
+    filtered = options.persistedIndex
+      ? filterByIdPrefixIndexed(filtered, numTrim, options.persistedIndex.idPrefixIndex)
+      : filtered.filter((s) => String(s.id).startsWith(numTrim));
+  }

   let entries: SongListEntry[];
   if (qTrim) {
-    entries = searchSongEntries(filtered, qTrim, options.categories, options.indexMap);
+    entries = options.persistedIndex
+      ? searchSongEntriesIndexed(filtered, qTrim, options.categories, options.persistedIndex)
+      : searchSongEntries(filtered, qTrim, options.categories, options.indexMap);
   } else {
     entries = expandSongsToEntries(filtered);
   }

   return sortListEntries(entries, options.sortMode ?? 'id');
 }
```

#### [MODIFY] [search.ts](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/utils/search.ts)

Mempertahankan `buildSearchIndex()` sebagai fallback, menambah integrasi dengan `PersistedSearchIndex`.

---

### 6. SongListScreen Integration

#### [MODIFY] [SongListScreen.tsx](file:///d:/Project/Mobile%20Project/PPR%20Mobile/src/screens/SongListScreen.tsx)

Minimal changes — pass `persistedIndex` ke `buildListEntries`:

```diff
- const { songs, goToId, currentSong, searchIndex } = useSongs();
+ const { songs, goToId, currentSong, searchIndex, persistedIndex } = useSongs();

 const results = useMemo(
   () =>
     buildListEntries(songs, {
       textQuery: debouncedQ.trim(),
       numberPrefix: numQ.trim(),
       categories,
       selectedTags,
       sortMode,
       indexMap: searchIndex,
+      persistedIndex,
     }),
-  [songs, debouncedQ, numQ, categories, selectedTags, sortMode, searchIndex]
+  [songs, debouncedQ, numQ, categories, selectedTags, sortMode, searchIndex, persistedIndex]
 );
```

---

## Ringkasan File yang Diubah

| File | Aksi | Deskripsi |
|------|------|-----------|
| `src/utils/searchIndexBuilder.ts` | **NEW** | Core engine: build inverted index, trigram index, query & rank |
| `src/services/storage.ts` | MODIFY | Tambah `dbSearchIndexKey()` helper |
| `src/services/updater.ts` | MODIFY | Build & persist index saat `downloadUpdate()` |
| `src/services/databaseRegistry.ts` | MODIFY | Cleanup index saat remove/clear profile |
| `src/context/SongContext.tsx` | MODIFY | Load persisted index, fallback ke in-memory build |
| `src/utils/songListEntries.ts` | MODIFY | Upgrade search logic dengan inverted index |
| `src/utils/search.ts` | MODIFY | Pertahankan sebagai fallback, tambah helper baru |
| `src/screens/SongListScreen.tsx` | MODIFY | Pass `persistedIndex` ke `buildListEntries` |

---

## Verification Plan

### Automated Tests
- Buat unit test untuk `searchIndexBuilder.ts`:
  - `buildPersistedIndex()` menghasilkan index yang valid
  - `tokenize()` handle teks Indonesia dengan benar (apostrof, tanda hubung)
  - `queryIndex()` menemukan hasil yang tepat untuk berbagai query pattern
  - `rankResults()` menghasilkan urutan yang benar (title > credit > lyrics)
  - Trigram fallback bekerja untuk partial word queries

### Manual Verification
1. **Fresh install test**: Pastikan app tetap berfungsi tanpa persisted index (fallback)
2. **Download test**: Download database dari GitHub → verify index ter-build & tersimpan
3. **Search comparison**: Bandingkan hasil pencarian sebelum dan sesudah dengan query-query berikut:
   - Full word: "kasih", "Yesus", "menyembah"
   - Partial: "ber", "ku", "had"  
   - Multi-word: "kasih Tuhan", "hadirat Mu"
   - By number: "1", "10", "100"
   - By tag: "penyembahan", "persekutuan"
4. **Performance test**: Ukur waktu search dengan `console.time` sebelum vs sesudah
5. **Database switch test**: Switch antar database profiles → verify index ter-load dengan benar
6. **Profile cleanup test**: Hapus profile → verify index juga terhapus
