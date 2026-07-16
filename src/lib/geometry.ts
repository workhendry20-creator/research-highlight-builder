import type { Design } from '../schema/document';

export const PAGE_W = 210; // mm, A4
export const PAGE_H = 297;

/**
 * The one invariant of this whole app: column width is identical on every page.
 * Page 1 spends its last column on the sidebar. Page 2 spends it on text.
 * Never set a different `column-count` per page — the pages stop looking related.
 */
export function grid(d: Design) {
  const placement = d.highlightsPlacement ?? 'page1';
  // A right rail is a *separate* sidebar column: sidebar on, and placement is
  // 'page1' or 'all'. 'all' repeats it on page 2; 'page1' gives page 2 to text.
  const rail = d.sidebar && (placement === 'page1' || placement === 'all');
  const railEvery = rail && placement === 'all';
  // 'page1-flow': no separate rail — the highlights box rides the page-1 body
  // flow as a one-column atom, so text fills the gap above it before spilling.
  const flow = d.sidebar && placement === 'page1-flow';
  // Either way the highlights consume one grid column, so the column width
  // stays identical to 'page1'. (The invariant: same col width on every page.)
  const extraCol = rail || flow;

  const totalCols = d.bodyCols + (extraCol ? 1 : 0);
  const content = PAGE_W - 2 * d.margin;
  const col = (content - (totalCols - 1) * d.gutter) / totalCols;
  const span = (n: number) => n * col + (n - 1) * d.gutter;

  return {
    totalCols,
    col,
    content,
    rail,
    railEvery,
    flow,
    // Page 1 body: separate rail → bodyCols wide; flow → all columns (the box
    // rides the flow); otherwise full content width.
    cols1: flow ? totalCols : d.bodyCols,
    body1: rail ? span(d.bodyCols) : content,
    // Page 2 body: only 'all' keeps a rail (so bodyCols wide); else full width.
    cols2: railEvery ? d.bodyCols : totalCols,
    body2: railEvery ? span(d.bodyCols) : content,
    span,
  };
}

/** Serif-ish families get a serif fallback; everything else falls back to sans.
 *  Fallback is cosmetic — the named families are either bundled or web-safe. */
const SERIF_FAMILIES = new Set([
  'Source Serif 4',
  'Georgia',
  'Times New Roman',
  'Palatino',
  'Playfair Display',
]);
const fontStack = (name: string) =>
  `"${name}", ${SERIF_FAMILIES.has(name) ? 'Georgia, serif' : 'system-ui, sans-serif'}`;

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
    '--cols-1': String(g.cols1),
    '--cols-2': String(g.cols2),
    // Raw body column count — the magazine spread reads this directly (it has no
    // sidebar grid, so the paper cols-1/cols-2 don't apply).
    '--body-cols': String(d.bodyCols),
    '--body-align': d.bodyAlign ?? 'justify',
    '--hero': d.colors.hero,
    '--accent': d.colors.accent,
    '--accent-soft': d.colors.accentSoft,
    '--ink': d.colors.ink,
    '--serif': `"${d.fontDisplay}", Georgia, serif`,
    '--sans': `"${d.fontBody}", system-ui, sans-serif`,
    // Per-element fonts. Undefined → the family the element used before this
    // setting existed, so old files render identically.
    '--font-category': d.fontCategory ? fontStack(d.fontCategory) : 'var(--sans)',
    '--font-subtitle': d.fontSubtitle ? fontStack(d.fontSubtitle) : 'var(--serif)',
    '--font-author': d.fontAuthor ? fontStack(d.fontAuthor) : 'var(--sans)',
    '--font-affil': d.fontAffiliation ? fontStack(d.fontAffiliation) : 'var(--sans)',
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