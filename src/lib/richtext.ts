/**
 * Inline text formatting stored *inside* the paragraph string, so the whole
 * pagination pipeline (which splits paragraphs at word boundaries) keeps working
 * on a plain `string`. No schema change, no structured runs to thread through
 * paginate().
 *
 * Markers, Word-style B/I/U only:
 *   **bold**   *italic*   __underline__
 *
 * `__` (double underscore) for underline — not single `_` — so physics
 * subscripts like `x_1` are never mistaken for formatting. A stray, unmatched
 * marker renders literally (see `parseRuns` pairing check).
 *
 * Inline math: `$…$` wraps LaTeX rendered by KaTeX (e.g. `$E = mc^2$`). Inside a
 * `$…$` span the content is verbatim TeX — B/I/U markers are NOT parsed there, so
 * `a^*` or `x_1` in a formula never trip the B/I/U machinery. A lone unmatched `$`
 * renders literally, same forgiving rule as the markers.
 */
import katex from 'katex';

export type Mark = 'b' | 'i' | 'u';

/** Render one TeX fragment to an HTML string. `display` picks block (centered,
 *  full-size) vs inline math. Never throws — a syntax error shows as KaTeX's red
 *  inline error instead of breaking the whole page. */
export const renderTex = (tex: string, display = false): string =>
  katex.renderToString(tex, { throwOnError: false, displayMode: display });

/** Longest tokens first so `**` wins over `*`, `__` over a lone `_`. */
export const DELIMS: { tok: string; mark: Mark }[] = [
  { tok: '**', mark: 'b' },
  { tok: '__', mark: 'u' },
  { tok: '*', mark: 'i' },
];

export const TOKEN: Record<Mark, string> = { b: '**', i: '*', u: '__' };

export interface Run {
  text: string;
  b: boolean;
  i: boolean;
  u: boolean;
  /** True for a `$…$` span — `text` is raw TeX, rendered by KaTeX, not styled. */
  math?: boolean;
}

/** Does `tok` appear again at or after `from`? Guards against treating a lone,
 *  unmatched marker (or a `*` the user typed as multiplication) as formatting. */
function hasCloser(src: string, from: number, tok: string): boolean {
  return src.indexOf(tok, from) !== -1;
}

/**
 * Split a paragraph string into styled runs. Nesting is supported (bold + italic
 * together) via a small open-marker stack; an unmatched marker stays literal.
 */
export function parseRuns(src: string): Run[] {
  const runs: Run[] = [];
  const open: string[] = []; // stack of open tokens, in nesting order
  let buf = '';
  const active = () => ({
    text: buf,
    b: open.includes('**'),
    i: open.includes('*'),
    u: open.includes('__'),
  });
  const flush = () => {
    if (buf) {
      runs.push(active());
      buf = '';
    }
  };

  let k = 0;
  while (k < src.length) {
    // Inline math wins over every B/I/U marker: a `$…$` span is captured whole
    // and its TeX kept verbatim, so markers/operators inside never parse.
    if (src[k] === '$') {
      const close = src.indexOf('$', k + 1);
      if (close !== -1) {
        flush();
        runs.push({ text: src.slice(k + 1, close), b: false, i: false, u: false, math: true });
        k = close + 1;
        continue;
      }
      // No closer ahead — treat this `$` as literal text (fall through).
    }
    let handled = false;
    for (const { tok } of DELIMS) {
      if (!src.startsWith(tok, k)) continue;
      const openIdx = open.lastIndexOf(tok);
      if (openIdx !== -1) {
        // Closing marker for something currently open.
        flush();
        open.splice(openIdx, 1);
        k += tok.length;
        handled = true;
        break;
      }
      if (hasCloser(src, k + tok.length, tok)) {
        // Opening marker with a matching closer ahead.
        flush();
        open.push(tok);
        k += tok.length;
        handled = true;
        break;
      }
      // Unmatched — fall through and treat this char as literal text.
    }
    if (!handled) {
      buf += src[k];
      k += 1;
    }
  }
  flush();
  return runs;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ESC[c]);

/**
 * Render runs to an HTML string. Used by the pagination measuring host so bold
 * (which is wider) is measured at its real width, matching the on-screen render.
 */
export function runsToHtml(src: string): string {
  return parseRuns(src)
    .map((r) => {
      if (r.math) return renderTex(r.text);
      let html = escapeHtml(r.text);
      if (r.b) html = `<strong>${html}</strong>`;
      if (r.i) html = `<em>${html}</em>`;
      if (r.u) html = `<u>${html}</u>`;
      return html;
    })
    .join('');
}

/**
 * Which markers are still open at the end of `s`, in nesting order. Used to
 * re-balance a paragraph split across a page break: markers opened before the
 * break must be closed on the head piece and reopened on the tail piece, or the
 * formatting would silently drop after the break. Counts every marker (no closer
 * lookahead) — mid-paragraph these genuinely are open, closed later downstream.
 *
 * `$` is tracked too: a break landing inside a `$…$` formula gets the `$` closed
 * on the head and reopened on the tail, so each side renders as a valid (if
 * partial) formula instead of leaking a literal `$`. While a `$` is open, B/I/U
 * markers are ignored — they're TeX there, not formatting.
 */
export function openMarkers(s: string): string[] {
  const open: string[] = [];
  let inMath = false;
  let k = 0;
  while (k < s.length) {
    if (s[k] === '$') {
      const i = open.lastIndexOf('$');
      if (i !== -1) {
        open.splice(i, 1);
        inMath = false;
      } else {
        open.push('$');
        inMath = true;
      }
      k += 1;
      continue;
    }
    if (inMath) {
      k += 1;
      continue;
    }
    let hit = false;
    for (const { tok } of DELIMS) {
      if (s.startsWith(tok, k)) {
        const i = open.lastIndexOf(tok);
        if (i !== -1) open.splice(i, 1);
        else open.push(tok);
        k += tok.length;
        hit = true;
        break;
      }
    }
    if (!hit) k += 1;
  }
  return open;
}

/**
 * Wrap (or unwrap) the current selection of a textarea with a marker, then
 * restore the selection. Toggling: if the selection is already wrapped in the
 * marker, it's removed — like clicking Bold twice in Word.
 */
export function wrapSelection(
  el: HTMLTextAreaElement,
  token: string,
  setValue: (v: string) => void,
): void {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const sel = value.slice(s, e);
  const before = value.slice(0, s);
  const after = value.slice(e);

  const alreadyWrapped =
    sel.startsWith(token) && sel.endsWith(token) && sel.length >= token.length * 2;
  const outsideWrapped = before.endsWith(token) && after.startsWith(token);

  let next: string;
  let ns: number;
  let ne: number;
  if (alreadyWrapped) {
    const inner = sel.slice(token.length, sel.length - token.length);
    next = before + inner + after;
    ns = s;
    ne = s + inner.length;
  } else if (outsideWrapped) {
    next = before.slice(0, -token.length) + sel + after.slice(token.length);
    ns = s - token.length;
    ne = e - token.length;
  } else {
    next = before + token + sel + token + after;
    ns = s + token.length;
    ne = e + token.length;
  }

  setValue(next);
  // Store update re-renders the controlled textarea (cursor jumps to end);
  // restore the selection after the commit paints.
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(ns, ne);
  });
}
