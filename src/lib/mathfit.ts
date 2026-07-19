/**
 * Shrink a display-equation box so its formula fits the column width.
 *
 * KaTeX renders display math as one non-breaking line — it can't wrap arbitrary
 * math the way text wraps. So "fit in one column" means scale the formula down
 * until it fits, not break it onto new lines. We scale via `font-size` (KaTeX is
 * em-based) rather than a CSS transform, so the layout box shrinks with it: no
 * leftover whitespace, and no sideways overflow left for paginate() to trip on.
 *
 * No-op when it already fits, or when there's no layout to measure (jsdom in
 * tests reports 0 widths). Column width is fixed (A4 mm), so one pass — width is
 * ~linear in font-size — lands within a pixel; a small safety factor covers the
 * rest.
 */
export function fitEquation(box: HTMLElement): void {
  box.style.fontSize = '';
  const avail = box.clientWidth;
  const natural = box.scrollWidth;
  if (avail > 0 && natural > avail) {
    const base = parseFloat(getComputedStyle(box).fontSize) || 16;
    box.style.fontSize = `${((base * avail) / natural) * 0.98}px`;
  }
}
