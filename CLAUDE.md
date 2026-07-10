# Research Highlight Builder

Membuat research highlight 1–2 halaman A4 untuk USM School of Physics.
Bukan editor paper akademik. Bukan Word.

## Aturan yang tidak boleh dilanggar

- Lebar kolom SAMA di semua halaman. Dihitung sekali di `lib/geometry.ts`.
  Halaman 1: 3 kolom body + 1 kolom sidebar. Halaman 2: 4 kolom body.
  JANGAN set `column-count` berbeda per halaman.
- Deteksi overflow multikolom pakai `scrollWidth > clientWidth`.
  `scrollHeight` SELALU false di kotak multikolom bertinggi tetap.
- `Doc.blocks` linear. Halaman dihitung, tidak pernah disimpan.
- Gambar di-anchor ke paragraf, tidak pernah ke koordinat.
- `paper/` tidak boleh mengimpor apa pun dari `panel/`.
- Body text rata kiri, bukan justify. Kolom 40mm + justify = sungai spasi.
- Drop cap pakai `::first-letter`, bukan elemen terpisah.
- jsdom tidak menghitung layout — `scrollWidth` selalu 0. Test untuk
  paginate() harus menyuntik parameter `isOverflowing`, bukan mengukur DOM.
- Jangan menulis ulang isi `src/lib/paginate.ts`, `src/lib/geometry.ts`,
  `src/schema/document.ts`, atau `src/store/useDoc.ts` tanpa diminta eksplisit.

## Export PDF
`window.print()` + `@page { size: A4; margin: 0 }` + `print-color-adjust: exact`.
JANGAN pakai @react-pdf/renderer — tidak mendukung column-count.
JANGAN pakai html2canvas — menghasilkan PDF raster.

## Stack
React + Vite + TS, Zustand + zundo, Dexie. Tanpa backend.

## Alur kerja
Satu PR per section. Conventional commits.
Jalankan `npx tsc --noEmit` sebelum commit.