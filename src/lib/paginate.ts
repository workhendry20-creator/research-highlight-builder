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
  page1: Piece[];
  page2: Piece[];
  /** 0..1 — how much of page 2 is used. Drives the "cut N words" nudge. */
  fill: number;
  /** content exceeds two pages */
  overflow: boolean;
  /** words currently living on page 2 */
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
      p.textContent = it.text;
      el.appendChild(p);
    }
  }
}

/**
 * `host1` / `host2` are hidden measuring nodes with the SAME box as the real
 * body containers. Never measure the visible DOM — React will fight you.
 */
export function paginate(
  host1: HTMLElement,
  host2: HTMLElement,
  items: FlowItem[],
  isOverflowing: (el: HTMLElement) => boolean = overflows,
): Pagination {
  const src: PaintItem[] = items.filter((it) => it.kind === 'figure' || it.text.trim() !== '');
  const none: Pagination = { page1: [], page2: [], fill: 0, overflow: false, spill: 0 };
  if (!src.length) return none;

  paint(host1, src);
  if (!isOverflowing(host1)) return { ...none, page1: toPieces(src) };

  let n = src.length;
  while (n > 0) {
    n--;
    paint(host1, src.slice(0, n));
    if (!isOverflowing(host1)) break;
  }

  const straddle = src[n];
  let page1: PaintItem[];
  let page2: PaintItem[];

  if (straddle.kind === 'figure') {
    // Atomic: the figure can't split, so it starts page 2.
    page1 = src.slice(0, n);
    page2 = src.slice(n);
  } else {
    // Binary-search the word boundary: ~10 iterations, all inside one JS task,
    // so no intermediate paint survives and no flicker.
    const w = words(straddle.text);
    let lo = 0,
      hi = w.length,
      best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      paint(host1, [...src.slice(0, n), { kind: 'text', text: w.slice(0, mid).join(' ') }]);
      if (!isOverflowing(host1)) {
        best = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    const head = w.slice(0, best).join(' ');
    const tail = w.slice(best).join(' ');
    page1 = [...src.slice(0, n), ...(head ? [{ kind: 'text' as const, text: head }] : [])];
    page2 = [
      ...(tail ? [{ kind: 'text' as const, text: tail, cont: Boolean(head) }] : []),
      ...src.slice(n + 1),
    ];
  }

  paint(host2, page2);
  host2.insertAdjacentHTML(
    'beforeend',
    '<span data-sentinel style="display:inline-block;width:1px;height:1px"></span>',
  );

  return {
    page1: toPieces(page1),
    page2: toPieces(page2),
    fill: fillOf(host2),
    overflow: isOverflowing(host2),
    spill: page2.reduce((a, it) => a + (it.kind === 'text' ? words(it.text).length : 0), 0),
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

/** The most useful sentence in the product: "cut about N words." */
export function fitMessage(p: Pagination): { level: FitLevel; text: string } {
  if (p.overflow)
    return { level: 'bad', text: `Over two pages. Cut roughly ${Math.round(p.spill * 0.3)} words.` };
  if (!p.spill) {
    // No text spilled — but a figure can still have pushed a second page.
    if (!p.page2.length) return { level: 'ok', text: '1 page' };
    return { level: 'ok', text: `2 pages · page 2 is ${Math.round(p.fill * 100)}% full` };
  }
  if (p.fill < 0.25)
    return { level: 'warn', text: `Page 2 is nearly empty. Cut about ${p.spill} words to fit one page.` };
  return { level: 'ok', text: `2 pages · page 2 is ${Math.round(p.fill * 100)}% full` };
}
