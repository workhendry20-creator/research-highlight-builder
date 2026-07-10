/**
 * One break point. Not a general pagination engine.
 *
 * The gotcha: in a fixed-height multicolumn box, overflow does NOT grow
 * scrollHeight — the browser spills a new column sideways. So we measure width.
 */
export const overflows = (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

export interface Para {
  text: string;
  /** true when this is the tail of a paragraph split across the break */
  cont?: boolean;
}

export interface Pagination {
  page1: Para[];
  page2: Para[];
  /** 0..1 — how much of page 2 is used. Drives the "cut N words" nudge. */
  fill: number;
  /** content exceeds two pages */
  overflow: boolean;
  /** words currently living on page 2 */
  spill: number;
}

/**
 * `host1` / `host2` are hidden measuring nodes with the SAME box as the real
 * body containers. Never measure the visible DOM — React will fight you.
 */
export function paginate(
  host1: HTMLElement,
  host2: HTMLElement,
  paragraphs: string[],
  isOverflowing: (el: HTMLElement) => boolean = overflows,
): Pagination {
  const paint = (el: HTMLElement, ps: Para[]) => {
    el.innerHTML = ps.map((p) => `<p${p.cont ? ' class="cont"' : ''}></p>`).join('');
    el.querySelectorAll('p').forEach((node, i) => (node.textContent = ps[i].text));
  };

  const src = paragraphs.map((s) => s.trim()).filter(Boolean);
  const none: Pagination = { page1: [], page2: [], fill: 0, overflow: false, spill: 0 };
  if (!src.length) return none;

  paint(host1, src.map((text) => ({ text })));
  if (!isOverflowing(host1)) return { ...none, page1: src.map((text) => ({ text })) };

  let n = src.length;
  while (n > 0) {
    n--;
    paint(host1, src.slice(0, n).map((text) => ({ text })));
    if (!isOverflowing(host1)) break;
  }

  // src[n] straddles the break. Binary-search the word boundary: ~10 iterations,
  // all inside one JS task, so no intermediate paint and no flicker.
  const w = words(src[n]);
  let lo = 0,
    hi = w.length,
    best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    paint(host1, [...src.slice(0, n).map((text) => ({ text })), { text: w.slice(0, mid).join(' ') }]);
    if (!isOverflowing(host1)) {
      best = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }

  const head = w.slice(0, best).join(' ');
  const tail = w.slice(best).join(' ');

  const page1: Para[] = [
    ...src.slice(0, n).map((text) => ({ text })),
    ...(head ? [{ text: head }] : []),
  ];
  const page2: Para[] = [
    ...(tail ? [{ text: tail, cont: Boolean(head) }] : []),
    ...src.slice(n + 1).map((text) => ({ text })),
  ];

  paint(host2, page2);
  host2.insertAdjacentHTML(
    'beforeend',
    '<span data-sentinel style="display:inline-block;width:1px;height:1px"></span>',
  );

  return {
    page1,
    page2,
    fill: fillOf(host2),
    overflow: isOverflowing(host2),
    spill: page2.reduce((a, p) => a + words(p.text).length, 0),
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
  if (!p.spill) return { level: 'ok', text: '1 page' };
  if (p.fill < 0.25)
    return { level: 'warn', text: `Page 2 is nearly empty. Cut about ${p.spill} words to fit one page.` };
  return { level: 'ok', text: `2 pages · page 2 is ${Math.round(p.fill * 100)}% full` };
}
