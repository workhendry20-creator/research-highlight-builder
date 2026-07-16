/**
 * One break point. Not a general pagination engine.
 *
 * The gotcha: in a fixed-height multicolumn box, overflow does NOT grow
 * scrollHeight — the browser spills a new column sideways. So we measure width.
 *
 * The flow is a linear list of items: paragraphs (splittable at word
 * boundaries) and figures (atomic full-width blocks). A figure never splits —
 * if it straddles the break it moves whole to page 2.
 */
import { runsToHtml, openMarkers } from './richtext';

export const overflows = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** Input item. Figures carry the geometry needed to measure their block.
 *  `full` = spans all columns (body width); otherwise one column wide. */
export type FlowItem =
  | { kind: 'text'; text: string }
  | { kind: 'figure'; id: string; aspect: number; hasCaption: boolean; full: boolean };

/** Working item during the search — a text run may be flagged as a continuation. */
type PaintItem =
  | { kind: 'text'; text: string; cont?: boolean }
  | { kind: 'figure'; id: string; aspect: number; hasCaption: boolean; full: boolean };

/** Output piece. Pages are rendered from these; figures resolve by id. */
export type Piece =
  | { kind: 'text'; text: string; cont?: boolean }
  | { kind: 'figure'; id: string };

export interface Pagination {
  /** pages[0] = page-1 geometry (hero + header). pages[1..] = continuation pages,
   *  all sharing the same taller box. As many pages as the text needs. */
  pages: Piece[][];
  /** 0..1 — how full the LAST page is. Drives the fit nudge. */
  fill: number;
  /** words living beyond page 1 (for the fit message) */
  spill: number;
}

const toPieces = (items: PaintItem[]): Piece[] =>
  items.map((it) =>
    it.kind === 'figure' ? { kind: 'figure', id: it.id } : { kind: 'text', text: it.text, cont: it.cont },
  );

/**
 * Render items into a measuring host. A figure becomes a full-width placeholder
 * whose height is derived from the host's current column-body width and the
 * image aspect ratio, so it displaces the same space as the real <figure>.
 */
function paint(el: HTMLElement, items: PaintItem[]) {
  el.innerHTML = '';
  const cs = getComputedStyle(el);
  const gap = parseFloat(cs.columnGap) || 0;
  const count = parseInt(cs.columnCount) || 1;
  const colW = count > 1 ? (el.clientWidth - (count - 1) * gap) / count : el.clientWidth;
  for (const it of items) {
    if (it.kind === 'figure') {
      const d = document.createElement('div');
      // Full-width figures span all columns; one-column figures displace only a
      // single column's worth of height.
      d.className = it.full ? 'flow-fig flow-fig--full' : 'flow-fig flow-fig--col';
      const w = it.full ? el.clientWidth : colW;
      const capPx = it.hasCaption ? Math.max(16, w * 0.06) : 0;
      d.style.height = `${w * it.aspect + capPx}px`;
      el.appendChild(d);
    } else {
      const p = document.createElement('p');
      if (it.cont) p.className = 'cont';
      // innerHTML (not textContent) so **bold**/*italic*/__underline__ render as
      // real inline styling — bold is wider, so the break must measure it.
      p.innerHTML = runsToHtml(it.text);
      el.appendChild(p);
    }
  }
}

/**
 * Fill one page box `host` with as many items as fit, splitting the straddling
 * paragraph at a word boundary (figures stay atomic). Returns what landed on the
 * page and what spills past it. This is the single break point — `paginate` just
 * calls it once per page.
 */
function fillOne(
  host: HTMLElement,
  src: PaintItem[],
  isOverflowing: (el: HTMLElement) => boolean,
): { placed: PaintItem[]; rest: PaintItem[] } {
  paint(host, src);
  if (!isOverflowing(host)) return { placed: src, rest: [] };

  let n = src.length;
  while (n > 0) {
    n--;
    paint(host, src.slice(0, n));
    if (!isOverflowing(host)) break;
  }

  const straddle = src[n];

  if (straddle.kind === 'figure') {
    // Atomic: the figure can't split, so it starts the next page.
    return { placed: src.slice(0, n), rest: src.slice(n) };
  }

  // Binary-search the word boundary: ~10 iterations, all inside one JS task,
  // so no intermediate paint survives and no flicker.
  const w = words(straddle.text);
  let lo = 0,
    hi = w.length,
    best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    paint(host, [...src.slice(0, n), { kind: 'text', text: w.slice(0, mid).join(' ') }]);
    if (!isOverflowing(host)) {
      best = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  let head = w.slice(0, best).join(' ');
  let tail = w.slice(best).join(' ');
  // Formatting markers open before the break must be closed on the head and
  // reopened on the tail, or the bold/italic/underline would drop after the
  // break. Plain text has no open markers, so this is a no-op there.
  if (head && tail) {
    const open = openMarkers(head);
    head += [...open].reverse().join(''); // close inner marker first
    tail = open.join('') + tail; // reopen in the same nesting order
  }
  return {
    placed: [...src.slice(0, n), ...(head ? [{ kind: 'text' as const, text: head }] : [])],
    rest: [
      ...(tail ? [{ kind: 'text' as const, text: tail, cont: Boolean(head) }] : []),
      ...src.slice(n + 1),
    ],
  };
}

/**
 * `host1` is the hidden measuring node for page 1 (hero + header eat its top).
 * `host2` is the taller continuation box — reused to measure every page ≥ 2,
 * since they share geometry. Never measure the visible DOM — React will fight you.
 */
export function paginate(
  host1: HTMLElement,
  host2: HTMLElement,
  items: FlowItem[],
  isOverflowing: (el: HTMLElement) => boolean = overflows,
): Pagination {
  const src: PaintItem[] = items.filter((it) => it.kind === 'figure' || it.text.trim() !== '');
  if (!src.length) return { pages: [], fill: 0, spill: 0 };

  const pages: PaintItem[][] = [];
  let rest = src;
  let host = host1; // page 1 first, then the continuation box for the rest

  while (rest.length) {
    let { placed, rest: next } = fillOne(host, rest, isOverflowing);
    // Progress guard: a single item taller than a whole page fits nowhere.
    // Force it onto its own page (clipped by overflow:hidden) rather than loop.
    if (placed.length === 0) {
      placed = [rest[0]];
      next = rest.slice(1);
    }
    pages.push(placed);
    rest = next;
    host = host2;
  }

  // Re-measure the last page to report how full it is + its word count.
  const last = pages[pages.length - 1];
  const lastHost = pages.length === 1 ? host1 : host2;
  paint(lastHost, last);
  lastHost.insertAdjacentHTML(
    'beforeend',
    '<span data-sentinel style="display:inline-block;width:1px;height:1px"></span>',
  );

  const spill = pages
    .slice(1)
    .flat()
    .reduce((a, it) => a + (it.kind === 'text' ? words(it.text).length : 0), 0);

  return {
    pages: pages.map(toPieces),
    fill: fillOf(lastHost),
    spill,
  };
}

/** Where did the last atom of text land? Column index + drop tells us fullness. */
export function fillOf(el: HTMLElement): number {
  const s = el.querySelector('[data-sentinel]');
  if (!s) return 0;
  const c = el.getBoundingClientRect();
  const r = s.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
  const count = parseInt(getComputedStyle(el).columnCount) || 1;
  const colW = (el.clientWidth - (count - 1) * gap) / count;
  const col = Math.round((r.left - c.left) / (colW + gap));
  if (!el.clientHeight) return 0;
  return Math.min(1, (col + (r.bottom - c.top) / el.clientHeight) / count);
}

export type FitLevel = 'ok' | 'warn' | 'bad';

/** How many pages, and how full the last one is. */
export function fitMessage(p: Pagination): { level: FitLevel; text: string } {
  const n = p.pages.length;
  if (n <= 1) return { level: 'ok', text: '1 page' };
  const pct = Math.round(p.fill * 100);
  // A barely-used last page is worth a gentle nudge, not an error — long is fine.
  if (p.spill && p.fill < 0.25)
    return {
      level: 'warn',
      text: `${n} pages · last page nearly empty. Cut ~${p.spill} words to save a page.`,
    };
  return { level: 'ok', text: `${n} pages · last page ${pct}% full` };
}
