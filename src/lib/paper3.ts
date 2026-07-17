import { PAGE_W } from './geometry';

/**
 * paper-3 ("Quantum Monograph") runs one hero photo across the sheet 1 / sheet 2
 * fold. Sheet 1 carries a band down its right edge, sheet 2 the mirror of it
 * down its left edge — laid side by side as a spread the two windows meet at the
 * fold and read as a single photo. There is only ever ONE asset; each sheet
 * paints a different window into it, exactly like magazine-2's strip.
 *
 * Sheet 1 is recto (rule left, band right, folio left); sheet 2 is its mirror.
 * Sheets 3+ keep sheet 2's orientation — they have no band, the photo is spent.
 *
 * Windows are plain background-position offsets in mm, so the same numbers hold
 * at any preview zoom and in the printed PDF.
 */

/** Width of the hero band on each sheet, mm. The wireframe's chrome does not sit
 *  on the text grid, so this is a fraction of the sheet rather than a column
 *  span — the two bands must be equal or the photo would not meet at the fold. */
export const P3_BAND_W = 0.6 * PAGE_W;

export interface BandPhoto {
  /** Painted photo size, mm — 'cover' over both bands side by side. */
  w: number;
  h: number;
  /** Top-left of the photo relative to the region's top-left (≤ 0), mm. */
  x: number;
  y: number;
}

/** Cover-fit `ar` (width/height) over the spread region: two bands wide, one
 *  band tall. Centred, so both sheets crop symmetrically. */
export function bandPhoto(ar: number, bandH: number, bandW = P3_BAND_W): BandPhoto {
  const regionW = bandW * 2;
  const w = Math.max(regionW, bandH * ar);
  const h = w / ar;
  return { w, h, x: (regionW - w) / 2, y: (bandH - h) / 2 };
}

/** Sheet 1's band shows the left half of the region (its own left edge). */
export const bandBgRecto = (p: BandPhoto) => ({
  backgroundSize: `${p.w}mm ${p.h}mm`,
  backgroundPosition: `${p.x}mm ${p.y}mm`,
});

/** Sheet 2 resumes one band further in, so its window shifts left by that much
 *  and the halves join across the fold. */
export const bandBgVerso = (p: BandPhoto, bandW = P3_BAND_W) => ({
  backgroundSize: `${p.w}mm ${p.h}mm`,
  backgroundPosition: `${p.x - bandW}mm ${p.y}mm`,
});
