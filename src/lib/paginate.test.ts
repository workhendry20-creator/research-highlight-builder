import { describe, expect, it } from 'vitest';
import { paginate, type FlowItem } from './paginate';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const text = (t: string): FlowItem => ({ kind: 'text', text: t });

const budgetOverflow = (budget: number) => (el: HTMLElement) => (el.textContent?.length ?? 0) > budget;

describe('paginate', () => {
  it('loses no words across the page break, even when a paragraph straddles it', () => {
    const paragraphs = [
      'Paragraph zero holds a short introduction sentence used as page one filler content for the test.',
      'Paragraph one is intentionally long so that it straddles the break between page one and page two during pagination alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey.',
      'Paragraph two lands entirely on page two after the break in this pagination test scenario.',
    ];

    // Fixed budget: fits paragraph zero plus roughly half of paragraph one,
    // forcing the break to land inside paragraph one's word list.
    const budget = paragraphs[0].length + Math.floor(paragraphs[1].length / 2);
    const isOverflowing = budgetOverflow(budget);

    const host1 = document.createElement('div');
    const host2 = document.createElement('div');

    const result = paginate(host1, host2, paragraphs.map(text), isOverflowing);

    const originalWords = paragraphs.flatMap(words);
    const producedWords = result.pages
      .flat()
      .filter((p): p is { kind: 'text'; text: string; cont?: boolean } => p.kind === 'text')
      .flatMap((p) => words(p.text));
    expect(producedWords).toEqual(originalWords);

    expect(result.pages[1][0]?.kind).toBe('text');
    expect((result.pages[1][0] as { cont?: boolean }).cont).toBe(true);
  });

  it('never splits a figure — a straddling figure moves whole to page 2', () => {
    const items: FlowItem[] = [
      text('Alpha bravo charlie delta echo foxtrot.'),
      { kind: 'figure', id: 'fig-1', aspect: 0.6, hasCaption: true, full: true },
      text('Golf hotel india juliet kilo lima.'),
    ];

    // jsdom has no layout, so a figure adds no textContent. Model its height by
    // counting the placeholder divs paginate paints. Budget of 500 fits the
    // first paragraph (~39 chars) but not once the figure's 1000 lands.
    const isOverflowing = (el: HTMLElement) =>
      (el.textContent?.length ?? 0) + el.querySelectorAll('.flow-fig').length * 1000 > 500;

    const host1 = document.createElement('div');
    const host2 = document.createElement('div');
    const result = paginate(host1, host2, items, isOverflowing);

    const figures = result.pages.flat().filter((p) => p.kind === 'figure');
    expect(figures).toEqual([{ kind: 'figure', id: 'fig-1' }]);
    // The figure is atomic: it appears exactly once and is never on both pages.
    expect(result.pages[0].some((p) => p.kind === 'figure' && p.id === 'fig-1')).toBe(false);
    expect(result.pages[1].some((p) => p.kind === 'figure' && p.id === 'fig-1')).toBe(true);
  });

  it('spills onto a third page (and beyond) without losing any words', () => {
    // Twelve paragraphs against a tight budget force at least three pages.
    const paragraphs = Array.from(
      { length: 12 },
      (_, i) =>
        `Paragraph ${i} carries several words alpha bravo charlie delta echo foxtrot golf hotel india juliet.`,
    );
    // Budget fits only ~2.5 paragraphs per page, so 12 need 5 pages.
    const budget = paragraphs[0].length * 2.5;
    const isOverflowing = budgetOverflow(budget);

    const host1 = document.createElement('div');
    const host2 = document.createElement('div');
    const result = paginate(host1, host2, paragraphs.map(text), isOverflowing);

    expect(result.pages.length).toBeGreaterThanOrEqual(3);

    const originalWords = paragraphs.flatMap(words);
    const producedWords = result.pages
      .flat()
      .filter((p): p is { kind: 'text'; text: string; cont?: boolean } => p.kind === 'text')
      .flatMap((p) => words(p.text));
    expect(producedWords).toEqual(originalWords);
  });
});
