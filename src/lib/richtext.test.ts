import { beforeAll, describe, expect, it } from 'vitest';
import { parseRuns, runsToHtml, openMarkers, wrapSelection } from './richtext';
import { paginate, type FlowItem } from './paginate';

beforeAll(() => {
  // wrapSelection restores the caret on the next frame; jsdom needs a stub.
  globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof requestAnimationFrame;
});

/** Drive wrapSelection against a real textarea and return the resulting value. */
function wrap(value: string, start: number, end: number, token: string): string {
  const ta = document.createElement('textarea');
  document.body.appendChild(ta);
  ta.value = value;
  ta.setSelectionRange(start, end);
  let out = value;
  wrapSelection(ta, token, (v) => (out = v));
  ta.remove();
  return out;
}

describe('wrapSelection', () => {
  it('wraps the selection with the marker', () => {
    expect(wrap('make me bold', 8, 12, '**')).toBe('make me **bold**');
  });

  it('unwraps when the selection is already wrapped (toggle off)', () => {
    // Select "**bold**" including the markers.
    expect(wrap('a **bold** b', 2, 10, '**')).toBe('a bold b');
  });

  it('inserts an empty marker pair when nothing is selected', () => {
    expect(wrap('ab', 1, 1, '*')).toBe('a**b');
  });
});

describe('parseRuns', () => {
  it('leaves plain text as a single unstyled run', () => {
    expect(parseRuns('hello world')).toEqual([{ text: 'hello world', b: false, i: false, u: false }]);
  });

  it('parses bold, italic and underline', () => {
    expect(parseRuns('**b**')).toEqual([{ text: 'b', b: true, i: false, u: false }]);
    expect(parseRuns('*i*')).toEqual([{ text: 'i', b: false, i: true, u: false }]);
    expect(parseRuns('__u__')).toEqual([{ text: 'u', b: false, i: false, u: true }]);
  });

  it('supports nesting (bold + italic together)', () => {
    expect(parseRuns('**a *b* c**')).toEqual([
      { text: 'a ', b: true, i: false, u: false },
      { text: 'b', b: true, i: true, u: false },
      { text: ' c', b: true, i: false, u: false },
    ]);
  });

  it('treats an unmatched marker as literal text', () => {
    expect(parseRuns('a * b')).toEqual([{ text: 'a * b', b: false, i: false, u: false }]);
  });

  it('never mistakes a single-underscore subscript for underline', () => {
    expect(parseRuns('x_1 and y_2')).toEqual([{ text: 'x_1 and y_2', b: false, i: false, u: false }]);
  });
});

describe('runsToHtml', () => {
  it('wraps runs and escapes HTML', () => {
    expect(runsToHtml('**bold**')).toBe('<strong>bold</strong>');
    expect(runsToHtml('a < b & c')).toBe('a &lt; b &amp; c');
  });
});

describe('openMarkers', () => {
  it('reports markers still open at the end', () => {
    expect(openMarkers('**a *b')).toEqual(['**', '*']);
    expect(openMarkers('**a**')).toEqual([]);
  });
});

describe('pagination preserves formatting across a break', () => {
  it('re-balances markers so bold does not leak or drop after the split', () => {
    // One long bold paragraph forced to straddle the page break.
    const para =
      '**alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar**';
    const items: FlowItem[] = [{ kind: 'text', text: para }];
    const budget = Math.floor(para.length / 2);
    const isOverflowing = (el: HTMLElement) => (el.textContent?.length ?? 0) > budget;

    const host1 = document.createElement('div');
    const host2 = document.createElement('div');
    const result = paginate(host1, host2, items, isOverflowing);

    expect(result.pages.length).toBe(2);
    const [head, tail] = result.pages.map(
      (pg) => (pg[0] as { kind: 'text'; text: string }).text,
    );
    // Every piece is self-balanced: bold opens and closes within it.
    for (const piece of [head, tail]) {
      expect(openMarkers(piece)).toEqual([]);
      expect(parseRuns(piece).every((r) => r.b)).toBe(true);
    }
    // No words lost (ignoring markers).
    const strip = (s: string) => s.replace(/\*\*/g, '').trim();
    expect(`${strip(head)} ${strip(tail)}`).toBe(strip(para));
  });
});
