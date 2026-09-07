# Jl. H. Junen AAA 3D Reconstruction Roadmap

Dokumen rencana kerja dan fase implementasi peningkatan detail model arsitektur 3D rumah di **Junen: Last Stand** dari bentuk *low-poly/basic geometric blocks* menjadi **AAA-quality procedural models**, mengacu secara presisi pada dokumentasi Google Maps Street View dari **Jl. H. Junen, Kalisari, Jakarta Timur**.

---

## 1. Standar Kualitas Visual (AAA Quality Target)

Untuk mencapai standar visual sekelas game komersial (*AAA game level*):
1. **Arsitektur Tidak Lagi Berupa Box Rata:**
   - Kusen pintu dan jendela memiliki *recessed reveal* (masuk ke dalam dinding minimal 6–10 cm).
   - Teras memiliki plin, undakan lantai keramik, dan dinding dengan profil semen/beton (*water drip / topi jendela*).
   - Atap dilengkapi nok wuwungan 3D, lisplang talang (*fascia*), serta kaso-kaso kayu yang tampak di bawah teritisan.
2. **Karakteristik Otentik Pemukiman Jakarta:**
   - **Toren Air Penguin Oranye:** Tabung silinder dengan cincin tulangan rusuk, tutup kubah, dan menara besi siku dengan tangga inspeksi & pipa paralon PVC.
   - **Pagar Besi Tempa & Batu Candi:** Pilar batu alam hitam bertekstur kasar dengan topi beton putih beveled, gerbang besi tempa ornamen spiral (*S-scrolls*) dengan medali emas dan mata tombak.
   - **Detail Budaya Lokal:** Tampah bambu jemuran kerupuk/nasi aking di atas pilar pagar, papan peringatan "DILARANG BUANG SAMPAH", plang "JL. H. JUNEN II", dan motor matic (Honda Beat/Vario style).
   - **Kanopi Realistis:** Kanopi pipa lengkung dengan teralis wajik/krepyak dan atap polikarbonat gelombang, atau kanopi baja ringan dengan tiang hollow.
   - **Utilitas & Environmental Props:** Kompresor outdoor AC Panasonic/Daikin lengkap dengan kipas dan bracket besi, boks meteran PLN prabayar (token), jalur kabel semrawut, jemuran baju berlipat alami, dan pot tanaman tropis.
3. **Optimasi Performa WebGL:**
   - Semua geometri prosedural digabung per-material bucket menggunakan `BufferGeometryUtils.mergeGeometries()` dengan spatial culling (chunk z/12), mempertahankan 60 FPS dan minim draw calls.

---

## 2. Fase Implementasi

### Fase 1: Generator Arsitektur & Props Prosedural Bersama
*Lokasi:* `src/games/junen-fighter/world/objects/architecture.ts`, `detail.ts`, `materials.ts`, `types.ts`
- [x] Material baru: Tekstur plesteran kasar (*kamprot*), bata lapuk, seng/asbes gelombang, genteng tanah liat morando, batu candi hitam, dan marmer wainscot.
- [x] Generator atap 3D: Genteng lengkung (*Spanish barrel tiles*), nok wuwungan bulat, dan atap asbes gelombang ber-kaso.
- [x] Generator pintu & jendela: Jendela casement dengan teralis tempa, pintu lipat garasi 4 daun, ventilasi roster jalusi berongga.
- [x] Generator props khas: Toren air Penguin & menara siku, kompresor AC outdoor, meteran PLN, tampah kerupuk, motor matic, dan saluran got precast.

### Fase 2: Area Masuk & Landmark 1 (z = -3 s/d 18)
*Lokasi:* `houses/whiteScroll.ts`, `houses/greenTank.ts`, `houses/treeCourt.ts`, `houses/paleGreen.ts`, `houses/creamCarport.ts`
- [x] **White Corner House (16 Jl. H. Junen):** Pagar batu candi hitam, gerbang besi tempa putih + medali emas, tampah bambu kerupuk di pilar, kanopi teras kayu, atap genteng 2 lapis.
- [x] **Green House & Water Tower (Jl. H. Junen II):** Dinding kamprot cokelat kasar + bata lapuk, atap asbes gelombang miring, toren oranye Penguin dengan rangka besi siku silang & tangga, plang gang, motor matic terparkir.
- [x] **Tree Court & Cream Carport:** Rumah 2 lantai modern tropis, pintu garasi lipat 4 daun, balkon kantilever dengan pilar belang hitam-putih ikonik, kompresor AC Panasonic ganda, kanopi carport lengkung.

### Fase 3: Area Pertengahan & Landmark 2 (z = 18 s/d 33)
*Lokasi:* `houses/turquoise.ts`, `houses/pineCourt.ts`, `houses/blueLow.ts`, `houses/gray.ts`
- [x] **Turquoise House (81 Jl. H. Junen):** Atap pelana tumpuk dengan lisplang kayu gelap, kanopi lengkung pipa besi berkarat dengan teralis wajik putih di bawahnya, dinding bawah motif marmer krem diagonal, jendela busur 4 daun, pagar besi tempa warna mint.
- [x] **Blue Low & Pine Court:** Rumah rendah biru dengan atap seng gelombang, pintu kayu, teras taman bunga dan jemuran baju.
- [x] **Gray House:** Fasad abu-abu minimalis, pintu gerbang dorong hitam, dinding aksen batu alam, tanaman rambat dinding.

### Fase 4: Area Ujung & Landmark 3 (z = 33 s/d 65)
*Lokasi:* `houses/lowYard.ts`, `houses/yellowBlack.ts`, `houses/whiteCar.ts`, `houses/laundry.ts`, `houses/pink.ts`, `houses/greenCar.ts`
- [x] **Yellow-Black House:** Rumah tingkat panjang kuning/krem, pagar horizontal hitam minimalis, jendela lantai 2 bertopi beton.
- [x] **Low Yard:** Halaman luas terbuka, teras santai, bale bambu, pohon rindang.
- [x] **White Car & Laundry:** Carport dengan mobil putih terparkir (nomor rumah 10), gerai laundry rumahan dengan spanduk & deretan pakaian.
- [x] **Pink House:** Landmark rumah tingkat pink, balkon lengkung dengan pagar tempa klasik lantai 2, kanopi teras lebar, tangga kayu, tangki air atap.
- [x] **Green Car:** Rumah penutup jalan, gerbang kisi-kisi, mobil hijau berselimut cover.

### Fase 5: Integrasi Lingkungan, Utilitas & Verifikasi Visual
*Lokasi:* `infrastructure.ts`, `junen-viewer.ts`, `JunenFighterGame.tsx`
- [x] Marka jalan: Tulisan stensil putih "JL. H. JUNEN" di aspal, tutup got bundar (*manhole cover*), tambalan aspal jalan.
- [x] Saluran drainase: Got beton tepi jalan dengan plat penutup beton berlubang (*drainage grates*).
- [x] Tiang & kabel listrik: Tiang beton PLN dengan bundelan kabel optik melorot (*kabel semrawut*) dan kabel sambungan ke atap rumah.
- [x] Verifikasi DevTools: Screenshot audit dari ke-13 sudut pandang `PHOTO_VIEWS` dan validasi FPS/draw calls.
- [x] Validasi build: `pnpm build` dan tes pertempuran `combat.test.mjs`.

---

## 3. Log Riwayat & Verifikasi

| Tanggal | Fase | Status | Keterangan |
| --- | --- | --- | --- |
| 2026-09-07 | Rencana & Audit | Selesai | Audit Street View & penyiapan roadmap rekonstruksi |
| 2026-09-07 | Fase 1 | Selesai | Generator arsitektur 3D & material prosedural (genteng lengkung, asbes gelombang, toren Penguin, AC, meteran PLN, got) |
| 2026-09-07 | Fase 2 | Selesai | Overhaul landmark masuk (16 Jl. H. Junen, toren Jl. H. Junen II, tampah jemuran kerupuk, plang gang, pagar batu candi) |
| 2026-09-07 | Fase 3 | Selesai | Overhaul landmark tengah (81 Jl. H. Junen atap pelana ganda + kanopi lengkung pipa + teralis wajik + marmer + jendela busur) |
| 2026-09-07 | Fase 4 | Selesai | Overhaul landmark ujung (rumah pink balkon klasik, yellow-black, laundry rumahan, carport mobil) |
| 2026-09-07 | Fase 5 | Selesai | Marka aspal Jl. H. Junen, tambalan aspal, manhole got bundar, verifikasi 13 sudut pandang 60 FPS, pnpm build lolos tanpa error |
| 2026-09-08 | Audit Rute & 1:1 Sync | Selesai | Koreksi arah Street View ke heading 301° (arah No. 16 ke No. 30). Rekonstruksi 1:1 presisi: Tree Court (gerbang polikarbonat hitam + kanopi lengkung cokelat), Pale Green (dinding aksen celah vertikal), White Car (dinding 3 ceruk hitam + pilar nomor 10 + gerbang putih), Laundry (plang hijau Jual Pulsa Elektrik & Laundry), Pink House (4 sangkar burung perkutut gantung), Green Car (bendera Merah Putih di tiang + gerbang dorong hitam), dan 4 marka stensil aspal "JL. H. JUNEN". |

