- jsdom tidak menghitung layout — `scrollWidth` selalu 0.
  Test untuk paginate() harus men-stub `overflows()`, bukan mengukur DOM sungguhan.
- Jangan pernah menulis ulang isi src/lib/paginate.ts atau src/lib/geometry.ts
  tanpa diminta eksplisit. Keputusan di dalamnya disengaja.