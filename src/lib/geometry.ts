import type { Design } from '../schema/document';

export const PAGE_W = 210; // mm, A4
export const PAGE_H = 297;

/**
 * The one invariant of this whole app: column width is identical on every page.
 * Page 1 spends its last column on the sidebar. Page 2 spends it on text.
 * Never set a different `column-count` per page — the pages stop looking related.
 */
export function grid(d: Design) {
  const totalCols = d.bodyCols + (d.sidebar ? 1 : 0);
  const content = PAGE_W - 2 * d.margin;
  const col = (content - (totalCols - 1) * d.gutter) / totalCols;
  const span = (n: number) => n * col + (n - 1) * d.gutter;

  return {
    totalCols,
    col,
    content,
    body1: span(d.bodyCols),
    body2: content,
    cols2: totalCols,
    span,
  };
}

/** Feed straight into style={{...}} on the page wrapper. */
export function cssVars(d: Design): Record<string, string> {
  const g = grid(d);
  return {
    '--page-w': `${PAGE_W}mm`,
    '--page-h': `${PAGE_H}mm`,
    '--margin': `${d.margin}mm`,
    '--gutter': `${d.gutter}mm`,
    '--col': `${g.col}mm`,
    '--body-1': `${g.body1}mm`,
    '--body-2': `${g.body2}mm`,
    '--hero-h': `${d.heroHeight}mm`,
    '--cols-1': String(d.bodyCols),
    '--cols-2': String(g.cols2),
    '--hero': d.colors.hero,
    '--accent': d.colors.accent,
    '--accent-soft': d.colors.accentSoft,
    '--ink': d.colors.ink,
    '--serif': `"${d.fontDisplay}", Georgia, serif`,
    '--sans': `"${d.fontBody}", system-ui, sans-serif`,
    '--fs-body': `${d.sizes.body}pt`,
    '--fs-title': `${d.sizes.title}pt`,
    '--fs-subtitle': `${d.sizes.subtitle}pt`,
    '--fs-eyebrow': `${d.sizes.categoryLabel}pt`,
    '--fs-author': `${d.sizes.author}pt`,
    '--fs-affil': `${d.sizes.affiliation}pt`,
  };
}

/** Characters-per-line guardrail. Below ~35 the column is unreadable. */
export function cplWarning(d: Design): string | null {
  const g = grid(d);
  const mmPerChar = (d.sizes.body * 0.35278 * 0.5) / 1;
  const cpl = Math.round(g.col / mmPerChar);
  if (cpl < 35) return `Columns fit about ${cpl} characters. Try 3 columns or a smaller body size.`;
  return null;
}