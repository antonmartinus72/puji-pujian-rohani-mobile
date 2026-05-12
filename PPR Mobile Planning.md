# PPR Mobile — Planning Document
**Puji-Pujian Rohani Mobile**

> Dokumen ini adalah panduan lengkap pengembangan aplikasi PPR Mobile, dibuat untuk developer yang familiar dengan React JS namun baru di React Native/Expo.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Tools yang Diperlukan](#3-tools-yang-diperlukan)
4. [Struktur Folder Proyek](#4-struktur-folder-proyek)
5. [Fitur & Prioritas](#5-fitur--prioritas)
6. [Desain UI & Navigasi](#6-desain-ui--navigasi)
7. [Skema Data Lagu (songs.json)](#7-skema-data-lagu-songsjson)
8. [Sistem Update via GitHub](#8-sistem-update-via-github)
9. [Fitur Daftar Ibadah (Worship Leader)](#9-fitur-daftar-ibadah-worship-leader)
10. [Roadmap Pengembangan](#10-roadmap-pengembangan)
11. [Catatan Penting untuk Pemula React Native](#11-catatan-penting-untuk-pemula-react-native)

---

## 1. Gambaran Umum

PPR Mobile adalah aplikasi buku puji-pujian rohani berbasis mobile yang:

- Bekerja sepenuhnya **offline** setelah install
- Data lagu dapat diperbarui dari **GitHub** tanpa perlu rilis ulang aplikasi
- Ditujukan untuk **jemaat gereja** (awam teknologi) dan **liturgos/worship leader**
- Dibangun dengan **React Native + Expo** (sangat familiar bagi pengguna React JS)

---

## 2. Tech Stack

| Kategori | Pilihan | Alasan |
|---|---|---|
| Framework | React Native + Expo | Setup mudah, tidak perlu Xcode/Android Studio penuh |
| Bahasa | JavaScript (atau TypeScript) | Familiar dari React JS |
| Navigasi | React Navigation v6 | Standar industri, dokumentasi lengkap |
| Penyimpanan lokal | AsyncStorage | Simpan JSON lagu & daftar ibadah user |
| Styling | NativeWind (Tailwind RN) | Familiar jika sudah pakai Tailwind di web |
| HTTP Request | fetch() bawaan | Untuk update lagu dari GitHub, tidak perlu library tambahan |
| State Management | React Context + useState | Cukup untuk skala aplikasi ini |
| Build & Deploy | Expo EAS Build | Build APK/IPA tanpa Mac/PC berspesifikasi tinggi |

---

## 3. Tools yang Diperlukan

### Wajib Diinstall

```bash
# 1. Node.js versi 18 ke atas
# Download dari: https://nodejs.org

# 2. Expo CLI
npm install -g expo-cli

# 3. EAS CLI (untuk build APK nanti)
npm install -g eas-cli

# 4. Git
# Download dari: https://git-scm.com
```

### Di HP (untuk Testing)

- **Android:** Install aplikasi **Expo Go** dari Google Play Store
- **iPhone:** Install aplikasi **Expo Go** dari App Store

> Dengan Expo Go, kamu bisa langsung test di HP jemaat tanpa perlu build APK — cukup scan QR code dari terminal.

### VS Code Extensions yang Direkomendasikan

- `ES7+ React/Redux/React-Native snippets` — shortcut komponen RN
- `Prettier` — format kode otomatis
- `React Native Tools` — debugging
- `Tailwind CSS IntelliSense` — jika pakai NativeWind

---

## 4. Struktur Folder Proyek

```
ppr-mobile/
├── app/                          # Halaman aplikasi (Expo Router, opsional)
│   atau
├── src/
│   ├── screens/                  # Halaman utama
│   │   ├── SongListScreen.jsx    # Daftar semua lagu
│   │   ├── SongReaderScreen.jsx  # Tampilan lirik lagu
│   │   ├── SearchScreen.jsx      # Pencarian judul & lirik
│   │   └── SetlistScreen.jsx     # Daftar ibadah worship leader
│   ├── components/
│   │   ├── Navbar.jsx            # Navigasi atas (sidebar, prev, id, next, search)
│   │   ├── Sidebar.jsx           # Daftar isi lagu (slide dari kiri)
│   │   ├── SongCard.jsx          # Item lagu di daftar
│   │   ├── LyricBlock.jsx        # Blok lirik per bait/refren
│   │   └── UpdateBanner.jsx      # Notifikasi ada update data lagu
│   ├── context/
│   │   ├── SongContext.jsx       # State global: daftar lagu, lagu aktif
│   │   └── SetlistContext.jsx    # State global: daftar ibadah user
│   ├── services/
│   │   ├── storage.js            # Wrapper AsyncStorage (get/set/clear)
│   │   └── updater.js            # Logic fetch & update songs.json dari GitHub
│   ├── utils/
│   │   └── search.js             # Fungsi pencarian lagu (judul + lirik)
│   └── constants/
│       └── config.js             # URL GitHub, versi app, dll
├── assets/
│   ├── songs.json                # Data lagu default (bundled saat install)
│   └── icon.png
├── App.jsx                       # Entry point
├── app.json                      # Konfigurasi Expo
└── package.json
```

---

## 5. Fitur & Prioritas

### Fase 1 — MVP (Wajib Ada)

- [x] **Daftar Lagu** — tampilkan semua lagu dengan nomor & judul
- [x] **Song Reader** — tampilkan lirik lengkap, font besar, mudah dibaca
- [x] **Navbar** — sidebar toggle | ← prev | nomor lagu | next → | 🔍 search
- [x] **Sidebar / Daftar Isi** — slide dari kiri, tap untuk pindah ke lagu
- [x] **Input Nomor Lagu** — tap pada nomor di navbar → muncul input → ketik nomor → langsung pindah
- [x] **Search** — cari berdasarkan judul ATAU lirik (fuzzy search sederhana)
- [x] **Update Lagu dari GitHub** — cek versi baru saat online, tawarkan update

### Fase 2 — Worship Leader

- [ ] **Daftar Ibadah** — buat setlist lagu untuk satu sesi ibadah
- [ ] **Kelola Setlist** — tambah, hapus, urutkan ulang lagu di setlist
- [ ] **Mode Setlist** — navigasi prev/next hanya dalam setlist aktif
- [ ] **Simpan Beberapa Setlist** — bisa buat dan beri nama tiap setlist
- [ ] **Share Setlist** — bagikan daftar lagu via teks (WhatsApp, dll)

### Fase 3 — Future

- [ ] **Chord Lagu** — tampilkan chord di atas lirik
- [ ] **Transpose Chord** — geser nada +/- semitone
- [ ] **Ukuran Font Adjustable** — setting untuk font lebih besar/kecil
- [ ] **Tema Gelap (Dark Mode)**
- [ ] **Favorit / Bookmark Lagu**

---

## 6. Desain UI & Navigasi

### Prinsip Desain

- Tampilan **sesimpel mungkin** — target pengguna awam teknologi
- Font lirik **besar** (minimal 18–20sp) agar nyaman dibaca
- Navigasi dengan **satu tangan** bila memungkinkan
- Tidak ada iklan, tidak ada loading screen yang lama

### Navbar (Komponen Utama)

```
┌─────────────────────────────────────────────────────┐
│  ☰    ←    [ 42 ]    →    🔍                        │
└─────────────────────────────────────────────────────┘
```

| Tombol | Aksi |
|---|---|
| ☰ (hamburger) | Show/hide Sidebar (daftar isi lagu) |
| ← | Pindah ke lagu sebelumnya |
| [ 42 ] (nomor lagu) | Tap → muncul modal input nomor lagu |
| → | Pindah ke lagu berikutnya |
| 🔍 | Buka halaman Search |

### Modal Input Nomor Lagu

- Muncul di tengah layar saat nomor lagu di-tap
- Keyboard numerik otomatis terbuka
- User ketik nomor → tekan Enter → langsung pindah
- Cocok untuk liturgos yang tahu nomor lagu di luar kepala

### Sidebar

- Slide masuk dari kiri (drawer)
- Berisi daftar semua lagu: `No. — Judul Lagu`
- Ada searchbar kecil di bagian atas sidebar
- Tap item → tutup sidebar → pindah ke lagu tersebut

### Song Reader

```
┌─────────────────────────────────────────────────────┐
│  Navbar (☰ ← [42] → 🔍)                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  42. Haleluya                                       │
│  ─────────────────────                              │
│                                                     │
│  Verse 1                                            │
│  Haleluya, pujilah Tuhan                            │
│  Dengan segenap hatimu                              │
│                                                     │
│  Chorus                                             │
│  Haleluya, haleluya...                              │
│  Mulia namaMu Tuhan                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Skema Data Lagu (songs.json)

### Format File

```json
{
  "version": "1.0.0",
  "updatedAt": "2025-01-10",
  "totalSongs": 2,
  "songs": [
    {
      "id": 1,
      "title": "Haleluya",
      "tags": ["pujian", "pembukaan"],
      "lyrics": [
        {
          "label": "Verse 1",
          "lines": [
            "Haleluya, pujilah Tuhan",
            "Dengan segenap hatimu"
          ]
        },
        {
          "label": "Chorus",
          "lines": [
            "Haleluya, haleluya",
            "Mulia namaMu Tuhan"
          ]
        },
        {
          "label": "Verse 2",
          "lines": [
            "Baris pertama verse 2",
            "Baris kedua verse 2"
          ]
        }
      ]
    },
    {
      "id": 2,
      "title": "Lagu Kedua",
      "tags": ["doa", "penutup"],
      "lyrics": [
        {
          "label": "Verse 1",
          "lines": ["..."]
        }
      ]
    }
  ]
}
```

### File version.json (terpisah, untuk cek update cepat)

```json
{
  "version": "1.0.0",
  "updatedAt": "2025-01-10",
  "changelog": "Penambahan 10 lagu baru (no. 201-210)"
}
```

---

## 8. Sistem Update via GitHub

### Setup Repository GitHub

1. Buat repository baru di GitHub, contoh: `ppr-mobile-data`
2. Set repository sebagai **Public** (agar bisa diakses tanpa autentikasi)
3. Upload dua file:
   - `songs.json` — seluruh data lagu
   - `version.json` — versi & changelog

### URL yang Digunakan Aplikasi

```javascript
// Di src/constants/config.js

const GITHUB_USERNAME = 'username_kamu';
const GITHUB_REPO = 'ppr-mobile-data';
const BRANCH = 'main';

export const VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/version.json`;
export const SONGS_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/songs.json`;
```

### Alur Update di Aplikasi

```
App dibuka
    │
    ├─── Offline? → Pakai data lokal, tidak ada error
    │
    └─── Online?
             │
             ▼
        Fetch version.json dari GitHub
             │
             ├─── Sama dengan versi lokal? → Tidak ada yang dilakukan
             │
             └─── Versi lebih baru?
                       │
                       ▼
                  Tampilkan banner/notifikasi:
                  "Ada pembaruan daftar lagu (v1.0.5). Unduh sekarang?"
                       │
                  User tap "Unduh"
                       │
                       ▼
                  Fetch songs.json dari GitHub
                       │
                       ▼
                  Simpan ke AsyncStorage
                       │
                       ▼
                  Reload data lagu di aplikasi
                  Tampilkan "Berhasil diperbarui!"
```

### Logic Updater (src/services/updater.js)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VERSION_URL, SONGS_URL } from '../constants/config';

export async function checkForUpdate() {
  try {
    const response = await fetch(VERSION_URL);
    const remoteVersion = await response.json();

    const localVersionStr = await AsyncStorage.getItem('songs_version');
    const localVersion = localVersionStr ? JSON.parse(localVersionStr) : null;

    if (!localVersion || remoteVersion.version !== localVersion.version) {
      return { hasUpdate: true, remoteVersion };
    }
    return { hasUpdate: false };
  } catch (error) {
    // Offline atau gagal — tidak apa-apa
    return { hasUpdate: false };
  }
}

export async function downloadUpdate(remoteVersion) {
  const response = await fetch(SONGS_URL);
  const songsData = await response.json();

  await AsyncStorage.setItem('songs_data', JSON.stringify(songsData));
  await AsyncStorage.setItem('songs_version', JSON.stringify(remoteVersion));

  return songsData;
}
```

### Cara Update Data Lagu (sebagai Admin)

1. Edit file `songs.json` di komputer (tambah/ubah lagu)
2. Update `version.json` — naikkan versi, misal `"1.0.0"` → `"1.0.1"`
3. Push kedua file ke GitHub
4. Aplikasi di HP jemaat akan otomatis menawarkan update saat online

---

## 9. Fitur Daftar Ibadah (Worship Leader)

### Konsep

Liturgos/worship leader dapat membuat "setlist" — daftar urutan lagu yang akan dinyanyikan dalam satu sesi ibadah. Setlist disimpan lokal di HP masing-masing.

### Alur Penggunaan

1. Buka tab "Daftar Ibadah" di aplikasi
2. Tap "Buat Baru" → beri nama setlist (misal: "Ibadah Minggu 12 Jan")
3. Cari & tambahkan lagu ke setlist
4. Urutkan ulang lagu dengan drag & drop
5. Simpan setlist
6. Saat ibadah: buka setlist → navigasi prev/next hanya bergerak dalam setlist tersebut

### Struktur Data Setlist (AsyncStorage)

```json
{
  "setlists": [
    {
      "id": "setlist_001",
      "name": "Ibadah Minggu 12 Jan",
      "createdAt": "2025-01-12T08:00:00Z",
      "songs": [42, 15, 7, 88, 3]
    }
  ]
}
```

---

## 10. Roadmap Pengembangan

### Sprint 1 (Minggu 1–2): Fondasi

- [ ] Setup proyek Expo baru
- [ ] Install & konfigurasi React Navigation
- [ ] Install AsyncStorage & NativeWind
- [ ] Buat data `songs.json` lokal dengan beberapa lagu sampel
- [ ] Buat `SongContext` untuk state global lagu

### Sprint 2 (Minggu 3–4): Fitur Utama

- [ ] Komponen `Navbar` dengan semua tombol
- [ ] `SongReaderScreen` — tampilkan lirik
- [ ] `SongListScreen` — daftar semua lagu
- [ ] `Sidebar` — drawer daftar isi
- [ ] Modal input nomor lagu

### Sprint 3 (Minggu 5–6): Search & Update

- [ ] `SearchScreen` dengan pencarian judul + lirik
- [ ] Implementasi `updater.js`
- [ ] `UpdateBanner` komponen
- [ ] Test update dari GitHub

### Sprint 4 (Minggu 7–8): Worship Leader

- [ ] `SetlistScreen` — daftar semua setlist
- [ ] Buat & kelola setlist
- [ ] Mode navigasi setlist
- [ ] Share setlist via teks

### Sprint 5+: Polish & Rilis

- [ ] Isi data lagu lengkap ke `songs.json`
- [ ] Testing di berbagai ukuran HP
- [ ] Build APK dengan Expo EAS
- [ ] Distribusi ke jemaat (sideload atau Google Play)

---

## 11. Catatan Penting untuk Pemula React Native

### Perbedaan dengan React JS

| React JS | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<TouchableOpacity>` atau `<Pressable>` |
| CSS file | `StyleSheet.create({})` atau NativeWind |
| `onClick` | `onPress` |
| `window.localStorage` | `AsyncStorage` |
| React Router | React Navigation |

### Tips Expo untuk Pemula

```bash
# Buat proyek baru
npx create-expo-app ppr-mobile

# Jalankan dev server
cd ppr-mobile
npx expo start

# Scan QR code dengan Expo Go di HP
# Setiap save file → otomatis reload di HP (Hot Reload)
```

### Perintah Git Dasar (untuk update data lagu)

```bash
# Clone repo data lagu
git clone https://github.com/username/ppr-mobile-data.git

# Setelah edit songs.json dan version.json
git add .
git commit -m "Tambah lagu 201-210"
git push
```

### Ketika Butuh Bantuan

- Dokumentasi Expo: https://docs.expo.dev
- Dokumentasi React Navigation: https://reactnavigation.org
- Dokumentasi React Native: https://reactnative.dev
- Forum: https://discord.gg/expo (komunitas aktif)

---

*Dokumen ini dibuat sebagai panduan awal pengembangan PPR Mobile.*
*Perbarui dokumen ini seiring perkembangan proyek.*