import type { Design } from '../schema/document';
import type { Pagination, Piece } from './paginate';
import { grid } from './geometry';

/**
 * paper-2 keeps the shared column grid of `geometry.ts` untouched — same column
 * width on every page — and only spends the top of sheet 1 differently: the
 * header takes the leading columns, the hero takes the last two.
 *
 *   ┌ bar ─────────────────────────────────────┐
 *   │ header (cols 1..n-2) │ hero (last 2 cols)│
 *   │ body left region     │ caption           │
 *   │ (cols 1..n-2)        │ body right │ rail │
 *   └──────────────────────────────────────────┘
 *
 * The left region starts under the header and the right one under the hero, so
 * their columns begin at different heights. One multicolumn box cannot do that,
 * which is why the two regions are separate boxes fed by `paginateHosts`.
 */
export const P2_HERO_COLS = 2;

export function paper2Grid(d: Design) {
  const g = grid(d);
  // The hero always claims the last two columns; the header claims the rest.
  const headCols = Math.max(1, g.totalCols - P2_HERO_COLS);
  const railCols = g.rail ? 1 : 0;
  // What's left under the hero, minus the rail, is the right text region.
  const rightCols = Math.max(1, g.totalCols - headCols - railCols);
  return {
    ...g,
    headCols,
    rightCols,
    /** Header + left text region. */
    leftW: g.span(headCols),
    /** Hero block: everything to the right of the header, rail included. */
    heroW: g.span(g.totalCols - headCols),
    /** Right text region only (the rail sits beside it). */
    rightW: g.span(rightCols),
  };
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * `paginateHosts` counts regions, not sheets, and paper-2 spends two regions on
 * sheet 1. Re-key the result to sheets so `fitMessage` reports "2 pages" for a
 * document that prints on two sheets, and `spill` counts only what left sheet 1.
 */
export function paper2Fit(p: Pagination): Pagination {
  const rest = p.pages.slice(2);
  const sheet1: Piece[] = [...(p.pages[0] ?? []), ...(p.pages[1] ?? [])];
  const spill = rest
    .flat()
    .reduce((a, pc) => a + (pc.kind === 'text' ? wordCount(pc.text) : 0), 0);
  return { pages: p.pages.length ? [sheet1, ...rest] : [], fill: p.fill, spill };
}
