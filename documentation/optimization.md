# Optimasi Performa Aplikasi (Performance Optimizations)

Dokumen ini mencatat berbagai optimasi kritis yang telah diterapkan pada aplikasi untuk memastikan performa yang cepat dan pengalaman pengguna (UX) yang mulus, terutama saat aplikasi pertama kali dimuat.

## 1. Pre-computed Search Indexing (Caching Pencarian)

Fitur pencarian aplikasi ini menggunakan sistem indeks teks penuh (*full-text search*) yang mencakup *word tokenization* (pemotongan kata) dan *trigram generation* (kombinasi 3 huruf berurutan) untuk mentoleransi salah ketik (*typo-tolerance*). 

### Masalah
Secara default, algoritma `buildPersistedIndex` memproses teks dari seluruh lagu (ratusan hingga ribuan lagu) untuk membangun indeks pencarian. Karena *JavaScript* di React Native berjalan pada sistem *single-threaded* (satu jalur proses), menjalankan komputasi berat ini saat aplikasi dibuka akan memblokir *Main Thread*. Akibatnya, UI aplikasi akan mengalami *freeze* (layar beku dan tidak bisa di-scroll) selama beberapa detik.

### Solusi & Implementasi
Daripada memaksa perangkat pengguna (HP) melakukan komputasi berat ini, kita memindahkannya ke tahap *development/build*:
1. **Skrip Eksternal (`scripts/precompute-index.js`)**: Sebuah skrip Node.js dibuat untuk membaca `assets/songs.json`, memproses seluruh logika pembuatan indeks secara instan di sisi komputer/server, dan menyimpan hasilnya ke dalam file **`assets/searchIndex.json`**.
2. **Bypass Runtime Indexing (`src/context/SongContext.tsx`)**: Saat aplikasi dijalankan dan menggunakan database bawaan (`default`), aplikasi akan langsung mengimpor file `searchIndex.json` secara statis. Aplikasi sepenuhnya melewati (bypass) algoritma `buildPersistedIndex`, sehingga waktu *loading* menjadi instan (0 detik komputasi).
3. **Penundaan Komputasi (Deferred Execution)**: Untuk database *custom* yang masih memerlukan proses indexing manual, fungsinya telah dibungkus menggunakan `InteractionManager.runAfterInteractions` dan `setTimeout`. Hal ini memastikan bahwa UI (antarmuka) dirender terlebih dahulu sebelum proses indexing berjalan secara senyap di belakang layar.

## 2. Fleksibilitas Validasi Database (Mencegah Infinite Loading)

Aplikasi memiliki sistem validasi yang ketat (`validateSongsPayload.ts`) untuk memastikan integritas data `songs.json` sebelum dimasukkan ke dalam memori aplikasi.

### Masalah
Database seringkali memiliki struktur kolom yang kosong untuk opsi opsional (seperti `rootNote` dan `scaleType`), yang direpresentasikan menggunakan *string* kosong (`""`). Sebelumnya, sistem validasi menganggap *string* kosong sebagai format yang salah (karena tidak sesuai dengan pola regular expression nada dasar). 

Bila satu atribut saja gagal tervalidasi, sistem akan mengosongkan seluruh memori lagu. Hal ini menyebabkan aplikasi tersangkut di layar `"Memuat lagu..."` untuk selamanya (karena UI menunggu objek lagu yang tidak akan pernah datang).

### Solusi & Implementasi
Logika validasi pada `src/utils/validateSongsPayload.ts` dioptimalkan agar lebih fleksibel:
- **Toleransi *Empty String*:** *String* kosong (`""`) pada field opsional kini diperlakukan sama dengan tipe `undefined`. Sistem akan mengabaikan pengecekan regular expression jika nilainya memang dikosongkan.
- Perubahan ini memastikan file sumber dari GitHub atau pengembang yang seringkali menggunakan format `""` (bawaan dari konversi CSV/Excel ke JSON) dapat lolos validasi dengan mulus tanpa memicu malfungsi antarmuka aplikasi.
